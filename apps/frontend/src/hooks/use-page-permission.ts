/**
 * This hook provides the permission level for the current page's resource.
 *
 * It works by:
 * 1. Retrieving the current user's permissions from the PermissionsProvider
 * 2. Getting the current resource ID from the ResourceProvider
 * 3. Finding the permission level for the specific resource
 *
 * The permission levels are:
 * - "NONE": No access to the resource
 * - "READ": Can view the resource but not modify it
 * - "WRITE": Can view and modify the resource
 * - "ACCESS": Full administrative access to the resource
 *
 * This hook is typically used in components to conditionally render UI elements
 * or enable/disable functionality based on the user's permission level.
 * It's often used with PermissionUtils to check specific capabilities:
 * - PermissionUtils.canRead(permissionLevel)
 * - PermissionUtils.canWrite(permissionLevel)
 * - PermissionUtils.canAccess(permissionLevel)
 *
 * @returns {PermissionLevel} The permission level for the current resource ("NONE", "READ", "WRITE", or "ACCESS")
 *
 * @example
 * // In a component
 * const permissionLevel = usePagePermission();
 *
 * // Conditionally render based on permission
 * {PermissionUtils.canWrite(permissionLevel) && (
 *   <Button onClick={handleEdit}>Edit</Button>
 * )}
 */
import { Permission, usePermissions } from "@/providers/permissions-provider";
import { useResourceId } from "@/providers/resource-provider";
import { PermissionLevel, ResourceId } from "@/types/resources";

export function usePagePermission(): PermissionLevel {
  const permissions = usePermissions()?.permissions;
  const resourceId = useResourceId()?.resourceId;

  /**
   * Helper function to get the permission level for a specific resource
   *
   * @param {Permission[]} permissions - Array of user permissions
   * @param {ResourceId} resourceId - The resource ID to check permissions for
   * @returns {PermissionLevel} The permission level for the resource
   */
  const getPermissionLevel = (
    permissions: Permission[],
    resourceId: ResourceId,
  ): PermissionLevel => {
    // Find the permission for the current resource
    const currentPermission = permissions.find(
      (permission) => permission.resourceName === resourceId,
    );
    // Return the permission level or "NONE" if not found
    return currentPermission?.permission ?? "NONE";
  };

  return getPermissionLevel(permissions, resourceId);
}
