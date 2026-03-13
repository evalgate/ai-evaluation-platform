export type OrgRole = "owner" | "admin" | "member" | "viewer";

export type Permission =
	| "artifacts:read"
	| "artifacts:delete"
	| "analysis:run"
	| "cluster:run"
	| "synthesis:generate"
	| "synthesis:accept"
	| "auto:create"
	| "auto:run"
	| "exports:download"
	| "sharing:create";

export const PERMISSION_DENIED_MESSAGE =
	"You do not have permission to perform this action.";

const permissionMatrix: Record<Permission, OrgRole[]> = {
	"artifacts:read": ["viewer", "member", "admin", "owner"],
	"artifacts:delete": ["admin", "owner"],
	"analysis:run": ["member", "admin", "owner"],
	"cluster:run": ["member", "admin", "owner"],
	"synthesis:generate": ["member", "admin", "owner"],
	"synthesis:accept": ["admin", "owner"],
	"auto:create": ["member", "admin", "owner"],
	"auto:run": ["member", "admin", "owner"],
	"exports:download": ["member", "admin", "owner"],
	"sharing:create": ["member", "admin", "owner"],
};

export class PermissionError extends Error {
	constructor(
		public readonly role: OrgRole,
		public readonly permission: Permission,
	) {
		super(PERMISSION_DENIED_MESSAGE);
		this.name = "PermissionError";
	}
}

export function hasPermission(role: OrgRole, permission: Permission): boolean {
	return permissionMatrix[permission].includes(role);
}

export function requirePermission(role: OrgRole, permission: Permission): void {
	if (!hasPermission(role, permission)) {
		throw new PermissionError(role, permission);
	}
}
