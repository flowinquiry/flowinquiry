import { z } from "zod";

export const OrganizationDTOSchema = z.object({
  id: z.number().nullish(),
  name: z.string().min(1),
  logoUrl: z.string(),
  slogan: z.string(),
  description: z.string(),
});

export type OrganizationDTO = z.infer<typeof OrganizationDTOSchema>;
