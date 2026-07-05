export type ResourceId =
  "users" | "teams" | "organizations" | "authorities" | "workflows" | "mail";

export type PermissionLevel = "NONE" | "READ" | "WRITE" | "ACCESS";

export const PermissionUtils = {
  canRead(permission: PermissionLevel): boolean {
    return (
      permission === "READ" || permission === "WRITE" || permission === "ACCESS"
    );
  },

  canWrite(permission: PermissionLevel): boolean {
    return permission === "WRITE" || permission === "ACCESS";
  },

  canAccess(permission: PermissionLevel): boolean {
    return permission === "ACCESS";
  },
};
