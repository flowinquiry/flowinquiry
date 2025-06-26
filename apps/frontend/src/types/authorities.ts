import * as z from "zod/v4";

export const AuthorityDTOSchema = z.object({
  name: z.string(),
  descriptiveName: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z0-9]+$/, {
      message:
        "Descriptive name must only contain letters (a-z, A-Z) and numbers (0-9), without spaces or special characters.",
    }),
  systemRole: z.boolean(),
  description: z.string().default("").optional(),
  usersCount: z.number().optional(),
});

export type AuthorityDTO = z.infer<typeof AuthorityDTOSchema>;

export const AuthorityResourcePermissionDTOSchema = z.object({
  authorityName: z.string(),
  resourceName: z.string(),
  permission: z.string(),
});

export type AuthorityResourcePermissionDTO = z.infer<
  typeof AuthorityResourcePermissionDTOSchema
>;
