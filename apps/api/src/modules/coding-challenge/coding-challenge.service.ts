import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CodingChallenge, ChallengeAttempt } from '../../schemas/coding-challenge.schema';
import { CodeSubmission } from '../../schemas/code-submission.schema';
import { CodeExecutionService } from '../code-execution/code-execution.service';

@Injectable()
export class CodingChallengeService implements OnModuleInit {
  private readonly logger = new Logger(CodingChallengeService.name);

  constructor(
    @InjectModel(CodingChallenge.name)
    private readonly challengeModel: Model<CodingChallenge>,
    @InjectModel(ChallengeAttempt.name)
    private readonly attemptModel: Model<ChallengeAttempt>,
    @InjectModel(CodeSubmission.name)
    private readonly submissionModel: Model<CodeSubmission>,
    private readonly executionService: CodeExecutionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    await this.seedChallenges();
  }

  private async seedChallenges() {
    const existing = await this.challengeModel.countDocuments();
    if (existing > 0) return;

    const fizzBuzzStarter = new Map<string, string>([
      ['javascript', `function fizzBuzz(n) {\n  // Write your code here\n  return [];\n}`],
      ['python', `def fizzBuzz(n):\n    # Write your code here\n    return []`],
    ]);

    const reverseStringStarter = new Map<string, string>([
      ['javascript', `function reverseString(str) {\n  // Write your code here\n  return "";\n}`],
      ['python', `def reverseString(str):\n    # Write your code here\n    return ""`],
    ]);

    const challenges = [
      {
        moduleId: 'mod-1',
        title: 'FizzBuzz Classic',
        prompt: 'Write a function `fizzBuzz(n)` returning an array of strings from 1 to n. For multiples of 3 return "Fizz", for 5 return "Buzz", for both return "FizzBuzz".',
        difficulty: 'easy' as const,
        starterCode: fizzBuzzStarter,
        testCases: [
          { id: 'fb-1', input: '5', expectedOutput: '["1","2","Fizz","4","Buzz"]', isHidden: false },
          { id: 'fb-2', input: '15', expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', isHidden: false },
          { id: 'fb-3', input: '3', expectedOutput: '["1","2","Fizz"]', isHidden: true },
        ],
        createdBy: 'seed' as const,
      },
      {
        moduleId: 'mod-1',
        title: 'Reverse String',
        prompt: 'Write a function `reverseString(str)` that takes a string input and returns its reverse character order.',
        difficulty: 'easy' as const,
        starterCode: reverseStringStarter,
        testCases: [
          { id: 'rev-1', input: 'hello', expectedOutput: 'olleh', isHidden: false },
          { id: 'rev-2', input: 'SmartRoadmap', expectedOutput: 'pamdaoRtramS', isHidden: false },
          { id: 'rev-3', input: 'a', expectedOutput: 'a', isHidden: true },
        ],
        createdBy: 'seed' as const,
      },
    ];

    for (const c of challenges) {
      const created = new this.challengeModel(c);
      await created.save();
    }
    this.logger.log('Demo Coding Challenges seeded successfully.');
  }

  async getChallenges(moduleId?: string, userId?: string) {
    const filter = moduleId ? { moduleId } : {};
    const challenges = await this.challengeModel.find(filter).exec();

    if (!userId) return challenges;

    // Fetch user attempts
    const attempts = await this.attemptModel.find({ userId: new Types.ObjectId(userId) }).exec();
    const attemptsMap = new Map(attempts.map((a) => [a.challengeId.toString(), a.passed]));

    return challenges.map((c) => ({
      ...c.toObject(),
      passed: attemptsMap.get(c._id.toString()) || false,
    }));
  }

  async getChallengeById(id: string, userId?: string) {
    const challenge = await this.challengeModel.findById(id).exec();
    if (!challenge) throw new NotFoundException('Coding Challenge not found');

    const result: any = challenge.toObject();

    // Do NOT return hidden test cases to the frontend to prevent client answer-fishing
    result.testCases = challenge.testCases.filter((tc) => !tc.isHidden);

    if (userId) {
      const attempt = await this.attemptModel.findOne({
        userId: new Types.ObjectId(userId),
        challengeId: challenge._id,
      }).exec();
      result.passed = attempt?.passed || false;
    }

    return result;
  }

  async submitCode(
    userId: string,
    challengeId: string,
    language: string,
    code: string,
  ): Promise<CodeSubmission> {
    const challenge = await this.challengeModel.findById(challengeId);
    if (!challenge) throw new NotFoundException('Challenge not found');

    const results: any[] = [];
    let allPassed = true;

    for (const tc of challenge.testCases) {
      // Wrap code with evaluation logic that reads standard input and invokes user functions
      const wrappedCode = this.wrapCodeForTest(language, code, challenge.title, tc.input);
      
      const execution = await this.executionService.runCode(language, wrappedCode, tc.input);

      // Clean string formatting to match expected output cleanly (stripping spaces, quotes, trailing breaks)
      const cleanActual = execution.stdout.trim().replace(/^['"`]|['"`]$/g, '').replace(/\s+/g, '');
      const cleanExpected = tc.expectedOutput.trim().replace(/^['"`]|['"`]$/g, '').replace(/\s+/g, '');

      const passed = cleanActual === cleanExpected && execution.code === 0 && !execution.stderr;
      if (!passed) allPassed = false;

      results.push({
        testCaseId: tc.id,
        passed,
        actualOutput: tc.isHidden ? 'Hidden' : execution.stdout.trim(),
        expectedOutput: tc.isHidden ? 'Hidden' : tc.expectedOutput,
        executionTimeMs: 120, // default estimation
      });
    }

    // 1. Create CodeSubmission document
    const submission = new this.submissionModel({
      userId: new Types.ObjectId(userId),
      challengeId: challenge._id,
      language,
      code,
      status: allPassed ? 'completed' : 'error',
      results,
    });
    await submission.save();

    // 2. Update ChallengeAttempt
    let attempt = await this.attemptModel.findOne({
      userId: new Types.ObjectId(userId),
      challengeId: challenge._id,
    });

    if (!attempt) {
      attempt = new this.attemptModel({
        userId: new Types.ObjectId(userId),
        challengeId: challenge._id,
        attemptsCount: 1,
        passed: allPassed,
        bestSubmissionId: submission._id,
      });
    } else {
      attempt.attemptsCount += 1;
      if (allPassed && !attempt.passed) {
        attempt.passed = true;
        attempt.bestSubmissionId = submission._id;
      }
    }
    await attempt.save();

    if (allPassed) {
      this.logger.log(`User ${userId} passed coding challenge ${challengeId}! Emitting event.`);
      this.eventEmitter.emit('challenge.passed', { userId, challengeId });
    }

    return submission;
  }

  private wrapCodeForTest(language: string, code: string, title: string, input: string): string {
    const isPython = language.toLowerCase() === 'python' || language.toLowerCase() === 'py';
    
    if (isPython) {
      if (title.toLowerCase().includes('fizzbuzz')) {
        return `${code}\nimport sys\nimport json\nval = int(sys.stdin.read().strip() or "0")\nprint(json.dumps(fizzBuzz(val)))`;
      }
      if (title.toLowerCase().includes('reverse')) {
        return `${code}\nimport sys\nval = sys.stdin.read().strip()\nprint(reverseString(val))`;
      }
      return code;
    } else {
      // JavaScript evaluation
      if (title.toLowerCase().includes('fizzbuzz')) {
        return `${code}\nconst fs = require('fs');\nconst val = parseInt(fs.readFileSync(0, 'utf-8').trim() || "0", 10);\nconsole.log(JSON.stringify(fizzBuzz(val)));`;
      }
      if (title.toLowerCase().includes('reverse')) {
        return `${code}\nconst fs = require('fs');\nconst val = fs.readFileSync(0, 'utf-8').trim();\nconsole.log(reverseString(val));`;
      }
      return code;
    }
  }
}
