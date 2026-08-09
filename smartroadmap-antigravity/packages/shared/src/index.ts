import { z } from "zod";

export const roadmapSchema = z.object({
  title: z.string(),
  totalEstimatedHours: z.number(),
  modules: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      prerequisites: z.array(z.string()), // IDs of prerequisite modules
      estimatedHours: z.number(),
      topics: z.array(z.string()),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    }),
  ),
});

export type RoadmapType = z.infer<typeof roadmapSchema>;

export const generateRoadmapDto = z.object({
  targetRole: z.string().min(2),
  currentRole: z.string().optional(),
  educationLevel: z.string().optional(),
  experienceYears: z.number().min(0).default(0),
  skills: z.array(z.string()).default([]),
});

export type GenerateRoadmapDtoType = z.infer<typeof generateRoadmapDto>;
