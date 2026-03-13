import { type NextRequest, NextResponse } from "next/server";
import { forbidden, internalError, validationError } from "@/lib/api/errors";
import { parseBody } from "@/lib/api/parse";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { SCOPES } from "@/lib/auth/scopes";
import { logger } from "@/lib/logger";
import { PermissionError, requirePermission } from "@/lib/permissions";
import { autoPlanPreviewBodySchema } from "@/lib/validation";
import {
	getMutationFamily,
	rankMutationFamilies,
} from "@/packages/sdk/src/cli/auto-families";
import { planNextIteration } from "@/packages/sdk/src/cli/auto-planner";

export const POST = secureRoute(
	async (req: NextRequest, ctx: AuthContext) => {
		try {
			requirePermission(ctx.role, "auto:create");
		} catch (error) {
			if (error instanceof PermissionError) {
				return forbidden(error.message);
			}
			throw error;
		}

		const parsed = await parseBody(req, autoPlanPreviewBodySchema);
		if (!parsed.ok) {
			return parsed.response;
		}

		const unknownFamilies = parsed.data.allowedFamilies.filter(
			(familyId) => !getMutationFamily(familyId),
		);
		if (unknownFamilies.length > 0) {
			return validationError(
				`Unknown mutation families: ${unknownFamilies.join(", ")}`,
			);
		}

		try {
			const proposal = await planNextIteration({
				iteration: parsed.data.iteration,
				objective: parsed.data.objective,
				targetPath: parsed.data.targetPath,
				targetContent: parsed.data.targetContent,
				allowedFamilies: parsed.data.allowedFamilies,
				clusterMemory: null,
				familyPriors: [],
				ledgerEntries: [],
				recentReflections: [],
				hypothesis: parsed.data.hypothesis,
				forbiddenChanges: parsed.data.forbiddenChanges,
			});
			const rankedFamilies = rankMutationFamilies(
				parsed.data.allowedFamilies,
				[],
			).map((familyId) => {
				const family = getMutationFamily(familyId);
				if (!family) {
					throw new Error(`Unknown mutation family '${familyId}'`);
				}
				return {
					id: family.id,
					description: family.description,
					estimatedCost: family.estimatedCost,
					targetedFailureModes: family.targetedFailureModes,
				};
			});

			return NextResponse.json({
				iteration: parsed.data.iteration,
				selectedFamily: proposal.selectedFamily,
				proposedPatch: proposal.proposedPatch,
				candidate: proposal.candidate,
				reason: proposal.reason ?? null,
				rankedFamilies,
			});
		} catch (error) {
			logger.error("Failed to generate auto plan preview", error, {
				route: "/api/evalgate/auto-plan",
				method: "POST",
				organizationId: ctx.organizationId,
			});
			return internalError("Failed to generate auto plan preview");
		}
	},
	{ requiredScopes: [SCOPES.REPORTS_WRITE] },
);
