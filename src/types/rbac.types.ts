export enum AppPermission {
  MANAGE_SYSTEM = 'manage_system',
  MANAGE_ADMINS = 'manage_admins',
  MANAGE_ROLES = 'manage_roles',
  MANAGE_USERS = 'manage_users',
  MANAGE_PRODUCTS = 'manage_products',
  MANAGE_PAYMENTS = 'manage_payments',
  MANAGE_AI = 'manage_ai',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
}

export interface UserRole {
  role: {
    name: string;
    description: string;
  };
}

export interface UserPermission {
  permission: {
    name: AppPermission;
  };
}
