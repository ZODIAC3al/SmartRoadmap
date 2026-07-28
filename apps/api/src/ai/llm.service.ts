import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import { createOpenAIClient } from './openai.client';
import axios from 'axios';

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private readonly isMockMode: boolean;
  private readonly client: OpenAI | null;
  private readonly geminiApiKey: string | null;

  constructor(private readonly config: ConfigService) {
    const { isMockMode, client } = createOpenAIClient(config, this.logger);
    this.isMockMode = isMockMode;
    this.client = client;
    this.geminiApiKey = config.get<string>('GEMINI_API_KEY') || null;
  }

  // ───────────────────────────── Mock builders ─────────────────────────────
  // Pure functions. Fallbacks call THESE, never the public method again —
  // the previous `catch { return this.generateRoadmap(...) }` was an infinite
  // recursion that crashed the process on the first OpenAI failure.

  private mockRoadmap(targetRole: string) {
    return {
      title: `Complete Learning Journey for ${targetRole}`,
      totalEstimatedHours: 45,
      modules: [
        {
          id: 'mod-1',
          title: `Introduction to ${targetRole} Foundations`,
          description: `Core fundamentals, tools and environment setup for ${targetRole}.`,
          prerequisites: [],
          estimatedHours: 10,
          topics: [
            'Environment Setup',
            'Foundational Concepts',
            'Hello World Projects',
          ],
          difficulty: 'beginner',
          status: 'in_progress',
          positionX: 100,
          positionY: 150,
        },
        {
          id: 'mod-2',
          title: `Intermediate ${targetRole} & Best Practices`,
          description:
            'Core patterns, architecture, and clean code principles.',
          prerequisites: ['mod-1'],
          estimatedHours: 15,
          topics: [
            'Core Patterns',
            'Routing & Data Fetching',
            'State Management',
          ],
          difficulty: 'intermediate',
          status: 'locked',
          positionX: 300,
          positionY: 150,
        },
        {
          id: 'mod-3',
          title: `Advanced ${targetRole} & Deployment`,
          description:
            'Testing, CI/CD, production bundling, scalability and performance.',
          prerequisites: ['mod-2'],
          estimatedHours: 20,
          topics: [
            'Unit & Integration Testing',
            'Dockerization',
            'Cloud Deployment',
          ],
          difficulty: 'advanced',
          status: 'locked',
          positionX: 500,
          positionY: 150,
        },
      ],
    };
  }

  private mockQuiz(topic: string, difficulty: string, count: number) {
    const topicLower = topic.toLowerCase();
    
    // 1. Identify Domain
    let domain: 'frontend' | 'backend' | 'datascience' | 'devops' | 'general' = 'general';
    if (topicLower.includes('frontend') || topicLower.includes('front-end') || topicLower.includes('web') || topicLower.includes('react')) {
      domain = 'frontend';
    } else if (topicLower.includes('backend') || topicLower.includes('back-end') || topicLower.includes('api') || topicLower.includes('node') || topicLower.includes('express')) {
      domain = 'backend';
    } else if (topicLower.includes('data') || topicLower.includes('science') || topicLower.includes('learning') || topicLower.includes('python')) {
      domain = 'datascience';
    } else if (topicLower.includes('devops') || topicLower.includes('cloud') || topicLower.includes('deploy') || topicLower.includes('docker') || topicLower.includes('kubernetes')) {
      domain = 'devops';
    }

    // 2. Identify Level
    let level: 'foundations' | 'intermediate' | 'advanced' = 'foundations';
    if (topicLower.includes('intermediate') || topicLower.includes('practice') || topicLower.includes('pattern') || topicLower.includes('state')) {
      level = 'intermediate';
    } else if (topicLower.includes('advanced') || topicLower.includes('deployment') || topicLower.includes('testing') || topicLower.includes('dockerization')) {
      level = 'advanced';
    }

    // 3. Question Pools Definition
    const pools: Record<string, Record<string, Array<{ question: string; correct: string; incorrect: string[] }>>> = {
      frontend: {
        foundations: [
          {
            question: "Which HTML5 element is used to define semantic navigation links?",
            correct: "<nav>",
            incorrect: ["<navigation>", "<navbar>", "<links>"]
          },
          {
            question: "What is the difference between CSS selectors '#' and '.'?",
            correct: "'#' targets unique element IDs, while '.' targets class names.",
            incorrect: [
              "'.' targets IDs, while '#' targets HTML tag elements.",
              "'#' is for inline styling, while '.' is for external stylesheets.",
              "They are syntactically identical and completely interchangeable."
            ]
          },
          {
            question: "Which JavaScript variable declaration has block scope?",
            correct: "const and let",
            incorrect: ["var", "global", "define"]
          },
          {
            question: "What is the main purpose of CSS media queries?",
            correct: "To apply specific styling rules based on screen resolutions and device viewports.",
            incorrect: [
              "To import external video or audio files into the page.",
              "To query SQL databases for styling parameters.",
              "To calculate the execution speed of layout transitions."
            ]
          },
          {
            question: "Which JavaScript event handler triggers when a user clicks on an element?",
            correct: "onclick",
            incorrect: ["onhover", "onsubmit", "onload"]
          }
        ],
        intermediate: [
          {
            question: "What is the primary purpose of React component state?",
            correct: "To store dynamic data that triggers components to re-render when changed.",
            incorrect: [
              "To save persistent server-side database variables.",
              "To define routing configuration maps.",
              "To cache image assets locally in the browser."
            ]
          },
          {
            question: "How does component communication flow by default in React?",
            correct: "Unidirectionally, downward from parent to child via props.",
            incorrect: [
              "Bidirectionally, automatically syncing sibling states.",
              "Upward from child to parent components only.",
              "Directly between sibling components without parent involvement."
            ]
          },
          {
            question: "What is the purpose of React hooks like useState?",
            correct: "To allow functional components to manage local state and lifecycle methods.",
            incorrect: [
              "To connect client components directly to relational databases.",
              "To execute server-side compilation processes.",
              "To download cache configuration files."
            ]
          },
          {
            question: "Which pattern helps prevent 'prop drilling' in deeply nested React components?",
            correct: "React Context API or global state managers like Redux.",
            incorrect: [
              "Nesting component structures even deeper.",
              "Using inline CSS styles instead of utility class classes.",
              "Defining all state values on the global window object."
            ]
          },
          {
            question: "What does JSX represent in React applications?",
            correct: "A syntax extension that allows writing HTML-like tags inside JavaScript files.",
            incorrect: [
              "A database schema validation definition.",
              "A styling language replacing Sass.",
              "A command-line tool replacing npm."
            ]
          }
        ],
        advanced: [
          {
            question: "What is the main goal of code splitting in bundling systems?",
            correct: "To divide bundles into smaller chunks loaded dynamically, improving page speed.",
            incorrect: [
              "To allocate codebase work to separate developers.",
              "To duplicate source code for database backups.",
              "To break code blocks into smaller lines for indentation."
            ]
          },
          {
            question: "How can you optimize rendering performance of large list structures in React?",
            correct: "By implementing windowing or list virtualization.",
            incorrect: [
              "By fetching items continuously on mouse scroll handlers.",
              "By wrapping lists in inline CSS grids.",
              "By disabling key props on list items."
            ]
          },
          {
            question: "What does the browser critical rendering path represent?",
            correct: "The sequence of steps the browser takes to convert HTML, CSS, and JS into pixels on screen.",
            incorrect: [
              "The folder path containing database credentials.",
              "The list of endpoints registered in routing definitions.",
              "The execution steps of the compiler runner."
            ]
          },
          {
            question: "Which HTTP header is standard to tell the browser how to cache web bundle files?",
            correct: "Cache-Control",
            incorrect: ["Content-Type", "Content-Length", "Cookie-Policy"]
          },
          {
            question: "What is the main purpose of Lighthouse audits in web pipelines?",
            correct: "To assess performance, accessibility, SEO, and best practices of a web page.",
            incorrect: [
              "To scan project dependencies for vulnerabilities.",
              "To compile TypeScript files into JavaScript.",
              "To host production databases on cloud clusters."
            ]
          }
        ]
      },
      backend: {
        foundations: [
          {
            question: "What does the HTTP status code 404 represent?",
            correct: "The requested resource could not be found on the server.",
            incorrect: ["Internal Server Error", "Unauthorized Access", "Bad Request Payload"]
          },
          {
            question: "Which HTTP method is typically used to create a new resource on the server?",
            correct: "POST",
            incorrect: ["GET", "PUT", "DELETE"]
          },
          {
            question: "What is the main role of a Web Server like Nginx?",
            correct: "To handle HTTP requests, serve static assets, and reverse-proxy to app servers.",
            incorrect: [
              "To store user credentials in database tables.",
              "To execute user interface animations.",
              "To run client-side JavaScript."
            ]
          },
          {
            question: "Which format is standard for exchanging API payload data?",
            correct: "JSON",
            incorrect: ["CSV", "TXT", "Binary Blob"]
          },
          {
            question: "What is the purpose of backend environment variables?",
            correct: "To keep configuration parameters and API secrets out of the source code.",
            incorrect: [
              "To log user session click events.",
              "To declare CSS styles for API JSON responses.",
              "To register pages with search engines."
            ]
          }
        ],
        intermediate: [
          {
            question: "What is the main benefit of adding an index to a database column?",
            correct: "It dramatically speeds up data retrieval queries on that column.",
            incorrect: [
              "It encrypts values to enhance security.",
              "It prevents insertion of duplicate records.",
              "It compresses physical file sizes."
            ]
          },
          {
            question: "What is a main difference between SQL and NoSQL databases?",
            correct: "SQL uses structured tables and relations; NoSQL uses flexible document schemas.",
            incorrect: [
              "SQL runs only locally; NoSQL runs exclusively on remote clouds.",
              "NoSQL databases do not support user credentials validation.",
              "SQL uses text files; NoSQL uses binary blobs."
            ]
          },
          {
            question: "Where is a JWT typically sent to authenticate API requests?",
            correct: "In the Authorization header as a Bearer token.",
            incorrect: ["In the URL search query parameters", "Inside client browser local storage variables", "Within CSS variables declarations"]
          },
          {
            question: "What is the primary role of an ORM like Mongoose or Prisma?",
            correct: "To query database records using OOP languages instead of raw database query strings.",
            incorrect: [
              "To coordinate routing paths between microservices.",
              "To compile TypeScript files into JavaScript.",
              "To host static landing pages."
            ]
          },
          {
            question: "Why is hashing passwords using bcrypt recommended?",
            correct: "It adds salts and stretches keys, making brute-force decryption extremely slow.",
            incorrect: [
              "It outputs shorter, cleaner hash strings.",
              "It is the only hash supported in Node environments.",
              "It automatically checks if a password is secure."
            ]
          }
        ],
        advanced: [
          {
            question: "What is the primary purpose of a Message Broker like RabbitMQ?",
            correct: "To manage asynchronous, decoupled communications between microservices via queues.",
            incorrect: [
              "To coordinate database schema locks.",
              "To serve static client stylesheets.",
              "To parse incoming API requests."
            ]
          },
          {
            question: "How does Redis improve API response latency?",
            correct: "By caching frequently accessed database records in memory.",
            incorrect: [
              "By rewriting backend files into machine instructions.",
              "By load-balancing database connections.",
              "By compressing image assets."
            ]
          },
          {
            question: "What is a core characteristic of microservices architectures?",
            correct: "Services are modular, independently deployable, and use separate databases.",
            incorrect: [
              "All services share a single large relational database.",
              "All services share local log files on the host disk.",
              "API endpoints are compiled into a single massive runtime process."
            ]
          },
          {
            question: "What is the difference between vertical and horizontal scaling?",
            correct: "Vertical adds resources (CPU/RAM) to a server; horizontal adds more servers.",
            incorrect: [
              "Vertical scaling is only applicable to database systems.",
              "Horizontal scaling is slower and less cost-effective.",
              "Vertical scaling is automatic, while horizontal is always manual."
            ]
          },
          {
            question: "What is the purpose of rate limiting on backend APIs?",
            correct: "To prevent system overload and denial-of-service abuse by limiting client calls.",
            incorrect: [
              "To limit client access to standard business hours.",
              "To minify JSON responses.",
              "To limit the number of fields in database queries."
            ]
          }
        ]
      },
      datascience: {
        foundations: [
          {
            question: "What is NumPy primarily used for in Python data pipelines?",
            correct: "High-performance multi-dimensional array operations and linear algebra.",
            incorrect: ["Building dashboard interfaces", "Scraping web pages", "Executing SQL queries"]
          },
          {
            question: "Which Python library is standard for plotting basic data graphs?",
            correct: "Matplotlib",
            incorrect: ["Pandas", "NumPy", "Flask"]
          },
          {
            question: "What does Exploratory Data Analysis (EDA) involve?",
            correct: "Analyzing datasets to summarize their main visual and statistical characteristics.",
            incorrect: ["Deploying models to production containers", "Creating secure backend sessions", "Writing database backups scripts"]
          }
        ],
        intermediate: [
          {
            question: "In Pandas, what structure represents a labeled, two-dimensional table?",
            correct: "DataFrame",
            incorrect: ["Series", "Panel", "Array"]
          },
          {
            question: "What is the goal of data imputation in machine learning pipelines?",
            correct: "To replace missing values with statistical estimations like mean or median.",
            incorrect: ["To compress CSV file sizes", "To secure API payloads", "To optimize database indexing speeds"]
          }
        ],
        advanced: [
          {
            question: "Why do data scientists split datasets into train and test sets?",
            correct: "To evaluate model performance on unseen data and diagnose overfitting.",
            incorrect: ["To run training processes in parallel", "To compress files", "To split dataset tables among databases"]
          },
          {
            question: "What is overfitting in machine learning algorithms?",
            correct: "When a model learns noise in training data too well, failing to generalize to new data.",
            incorrect: [
              "When an algorithm uses too many server cores.",
              "When model dataset size exceeds memory limits.",
              "When training sessions take too long."
            ]
          }
        ]
      },
      devops: {
        foundations: [
          {
            question: "Which command is used in Linux terminals to change folders?",
            correct: "cd",
            incorrect: ["ls", "pwd", "mkdir"]
          },
          {
            question: "What is the primary function of SSH connections?",
            correct: "To securely log in and run commands on remote servers.",
            incorrect: ["To track version changes", "To host source files", "To style templates"]
          }
        ],
        intermediate: [
          {
            question: "What is the primary function of Git?",
            correct: "To track code changes and coordinate versioning among developers.",
            incorrect: ["To compile scripts", "To host databases", "To load-balance HTTP traffic"]
          },
          {
            question: "Which Dockerfile instruction declares the base starter image?",
            correct: "FROM",
            incorrect: ["RUN", "CMD", "COPY"]
          }
        ],
        advanced: [
          {
            question: "What is the purpose of Kubernetes in cloud environments?",
            correct: "To automate container orchestration, scaling, and load-balancing.",
            incorrect: ["To validate JavaScript syntax", "To serve static HTML pages", "To encrypt user password values"]
          },
          {
            question: "What is Infrastructure as Code (IaC) using tools like Terraform?",
            correct: "Managing and provisioning server resources using machine-readable configurations.",
            incorrect: [
              "Writing backend services in binary instructions.",
              "Bypassing version control checkpoints.",
              "Pushing frontend modifications directly to production."
            ]
          }
        ]
      },
      general: {
        foundations: [
          {
            question: "What is the purpose of version control systems like Git?",
            correct: "To track file modifications and collaborate on code development.",
            incorrect: ["To run database queries", "To bundle frontend stylesheets", "To load-balance API routes"]
          },
          {
            question: "What does a compiler do?",
            correct: "Translates high-level source code into low-level machine instructions.",
            incorrect: ["Performs database backups", "Validates user logins", "Optimizes style layouts"]
          }
        ]
      }
    };

    // 4. Retrieve matching pool
    const selectedDomain = pools[domain] || pools.general;
    const selectedPool = selectedDomain[level] || selectedDomain.foundations || pools.general.foundations;

    // 5. Build and return the required number of questions
    return Array.from({ length: count }).map((_, index) => {
      const template = selectedPool[index % selectedPool.length];
      const allOptions = [template.correct, ...template.incorrect];
      
      // Shuffle options to randomize correct answer positions
      const shuffledOptions = [...allOptions];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }

      return {
        id: `q-${index + 1}`,
        question: template.question,
        options: shuffledOptions,
        correctAnswer: template.correct,
        explanation: `For ${topic} (${difficulty}), the correct answer represents established design paradigms: ${template.correct}`,
        difficulty,
      };
    });
  }

  private async callGemini(
    prompt: string,
    systemInstruction?: string,
    isJson = false,
  ): Promise<string | null> {
    if (!this.geminiApiKey) return null;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`;
      const contents = [];
      if (systemInstruction) {
        contents.push({
          role: 'user',
          parts: [{ text: `System instruction: ${systemInstruction}\n\nUser request: ${prompt}` }]
        });
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: prompt }]
        });
      }

      const body: any = { contents };
      if (isJson) {
        body.generationConfig = {
          responseMimeType: 'application/json'
        };
      }

      const response = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' }
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || null;
    } catch (error: any) {
      const errMsg = error.response?.data?.error?.message || error.message;
      this.logger.error(`Gemini API call failed: ${errMsg}`);
      return null;
    }
  }

  // ───────────────────────────── Public API ─────────────────────────────

  async generateRoadmap(
    targetRole: string,
    skills: string[] = [],
  ): Promise<any> {
    if (!this.isMockMode && this.client) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.config.get<string>('OPENAI_MODEL_SMART', 'gpt-4o'),
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are a curriculum designer. Reply with ONLY a JSON object of shape ' +
                '{title, totalEstimatedHours, modules:[{id,title,description,prerequisites[],' +
                'estimatedHours,topics[],difficulty,status,positionX,positionY}]}.',
            },
            {
              role: 'user',
              content: `Target role: "${targetRole}". Existing skills: ${skills.join(', ') || 'none'}.`,
            },
          ],
        });

        const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}');
        if (Array.isArray(parsed.modules) && parsed.modules.length > 0) {
          return parsed;
        }
      } catch (error: any) {
        this.logger.error(`OpenAI roadmap generation failed: ${error.message}`);
      }
    }

    // Try Gemini API
    if (this.geminiApiKey) {
      try {
        const system =
          'You are a curriculum designer. Reply with ONLY a JSON object of shape ' +
          '{title, totalEstimatedHours, modules:[{id,title,description,prerequisites[],' +
          'estimatedHours,topics[],difficulty,status,positionX,positionY}]}.';
        const prompt = `Target role: "${targetRole}". Existing skills: ${skills.join(', ') || 'none'}.`;
        const resText = await this.callGemini(prompt, system, true);
        if (resText) {
          const parsed = JSON.parse(resText);
          if (Array.isArray(parsed.modules) && parsed.modules.length > 0) {
            return parsed;
          }
        }
      } catch (error: any) {
        this.logger.error(`Gemini roadmap generation failed: ${error.message}`);
      }
    }

    return this.mockRoadmap(targetRole);
  }

  /**
   * Generic single-shot completion used by CvService etc.
   * Returns null in mock mode or on failure, so callers can fall back locally
   * instead of each service re-implementing `require('openai')` by hand.
   */
  async complete(
    prompt: string,
    options: { json?: boolean; system?: string } = {},
  ): Promise<string | null> {
    if (!this.isMockMode && this.client) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.config.get<string>('OPENAI_MODEL_FAST', 'gpt-4o-mini'),
          ...(options.json
            ? { response_format: { type: 'json_object' as const } }
            : {}),
          messages: [
            ...(options.system
              ? [{ role: 'system' as const, content: options.system }]
              : []),
            { role: 'user' as const, content: prompt },
          ],
        });
        return response.choices[0]?.message?.content?.trim() ?? null;
      } catch (error: any) {
        this.logger.error(`OpenAI completion failed: ${error.message}`);
      }
    }

    // Try Gemini API
    if (this.geminiApiKey) {
      try {
        return await this.callGemini(prompt, options.system, !!options.json);
      } catch (error: any) {
        this.logger.error(`Gemini completion failed: ${error.message}`);
      }
    }

    return null;
  }

  async generateQuiz(
    topic: string,
    difficulty: string,
    count = 5,
  ): Promise<any[]> {
    if (!this.isMockMode && this.client) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.config.get<string>('OPENAI_MODEL_FAST', 'gpt-4o-mini'),
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'Reply with ONLY a JSON object {questions: [{id, question, options[], correctAnswer, explanation, difficulty}]}.',
            },
            {
              role: 'user',
              content: `Generate ${count} questions about "${topic}" at ${difficulty} level.`,
            },
          ],
        });

        const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}');
        const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
        if (questions.length > 0) {
          return questions;
        }
      } catch (error: any) {
        this.logger.error(`OpenAI quiz generation failed: ${error.message}`);
      }
    }

    // Try Gemini API
    if (this.geminiApiKey) {
      try {
        const system =
          'Reply with ONLY a JSON object {questions: [{id, question, options[], correctAnswer, explanation, difficulty}]}.';
        const prompt = `Generate ${count} questions about "${topic}" at ${difficulty} level.`;
        const resText = await this.callGemini(prompt, system, true);
        if (resText) {
          const parsed = JSON.parse(resText);
          const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
          if (questions.length > 0) {
            return questions;
          }
        }
      } catch (error: any) {
        this.logger.error(`Gemini quiz generation failed: ${error.message}`);
      }
    }

    return this.mockQuiz(topic, difficulty, count);
  }
}
