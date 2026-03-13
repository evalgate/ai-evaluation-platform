import { describe, expect, it } from "vitest";
import {
	hasPermission,
	type OrgRole,
	type Permission,
	PermissionError,
	requirePermission,
} from "@/lib/permissions";

const cases: Array<{ permission: Permission; allowed: OrgRole[] }> = [
	{
		permission: "artifacts:read",
		allowed: ["viewer", "member", "admin", "owner"],
	},
	{ permission: "artifacts:delete", allowed: ["admin", "owner"] },
	{ permission: "analysis:run", allowed: ["member", "admin", "owner"] },
	{ permission: "cluster:run", allowed: ["member", "admin", "owner"] },
	{ permission: "synthesis:generate", allowed: ["member", "admin", "owner"] },
	{ permission: "synthesis:accept", allowed: ["admin", "owner"] },
	{ permission: "auto:create", allowed: ["member", "admin", "owner"] },
	{ permission: "auto:run", allowed: ["member", "admin", "owner"] },
	{ permission: "exports:download", allowed: ["member", "admin", "owner"] },
	{ permission: "sharing:create", allowed: ["member", "admin", "owner"] },
];

const roles: OrgRole[] = ["viewer", "member", "admin", "owner"];

describe("permissions", () => {
	it("hasPermission returns the expected value for every role and permission", () => {
		for (const testCase of cases) {
			for (const role of roles) {
				expect(hasPermission(role, testCase.permission)).toBe(
					testCase.allowed.includes(role),
				);
			}
		}
	});

	it("requirePermission throws PermissionError for denied access", () => {
		for (const testCase of cases) {
			for (const role of roles.filter(
				(candidate) => !testCase.allowed.includes(candidate),
			)) {
				expect(() => requirePermission(role, testCase.permission)).toThrow(
					PermissionError,
				);
			}
		}
	});

	it("requirePermission does not throw for allowed access", () => {
		for (const testCase of cases) {
			for (const role of testCase.allowed) {
				expect(() =>
					requirePermission(role, testCase.permission),
				).not.toThrow();
			}
		}
	});
});
