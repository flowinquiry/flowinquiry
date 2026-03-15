import { z } from "zod";

export type ProjectStatus = "Active" | "Closed" | "Cancelled";

export const EstimationUnitSchema = z.enum(["STORY_POINTS", "DAYS"]);

export const ProjectSettingDTOSchema = z.object({
  id: z.number().int().positive().optional(),
  projectId: z.number().int().positive(),
  sprintLengthDays: z.number().int().positive(),
  defaultPriority: z.enum(["Critical", "High", "Medium", "Low", "Trivial"]),
  estimationUnit: EstimationUnitSchema,
  enableEstimation: z.boolean(),
  integrationSettings: z.record(z.string(), z.any()).optional().nullable(),
  createdBy: z.number().int().positive().optional(),
  createdAt: z.string().datetime().optional(),
  modifiedBy: z.number().int().positive().optional(),
  modifiedAt: z.string().datetime().optional(),
});

export type ProjectSettingDTO = z.infer<typeof ProjectSettingDTOSchema>;

export const ProjectSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  teamId: z.number().int().positive(),
  teamName: z.string().optional(),
  shortName: z.string().min(1).max(10),
  status: z.enum(["Active", "Closed", "Cancelled"]),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  createdBy: z.number().int().positive().optional(),
  createdAt: z.string().datetime().optional(),
  modifiedBy: z.number().int().positive().optional(),
  modifiedAt: z.string().datetime().optional(),
  projectSetting: ProjectSettingDTOSchema.optional(),
});

export type ProjectDTO = z.infer<typeof ProjectSchema>;

export const ProjectIterationDTOSchema = z
  .object({
    id: z.number().optional(),
    projectId: z.number(),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    status: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    totalTickets: z.number().optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.startDate) <= new Date(data.endDate);
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );

export const ProjectIterationFormSchema = z.object({
  id: z.number().optional(),
  projectId: z.number(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  totalTickets: z.number().optional(),
});

export type ProjectIterationFormValues = z.infer<
  typeof ProjectIterationFormSchema
>;

export type ProjectIterationDTO = z.infer<typeof ProjectIterationDTOSchema>;

export const ProjectEpicDTOSchema = z.object({
  id: z.number().optional(),
  projectId: z.number(),
  name: z.string(),
  description: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  totalTickets: z.number().optional(),
});

export type ProjectEpicDTO = z.infer<typeof ProjectEpicDTOSchema>;
