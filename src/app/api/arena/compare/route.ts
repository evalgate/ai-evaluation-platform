import { type NextRequest, NextResponse } from "next/server";
import { internalError, validationError } from "@/lib/api/errors";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { comparisonEngine } from "@/lib/arena/comparison-engine";
import { logger } from "@/lib/logger";
import { arenaMatchesService } from "@/lib/services/arena-matches.service";

export const POST = secureRoute(async (req: NextRequest, ctx: AuthContext) => {
	const body = await req.json();
	const { prompt, models, judgeConfigId } = body;

	if (!prompt || !models || !Array.isArray(models) || models.length < 2) {
		return validationError(
			"prompt (string) and models (array of ≥2 model IDs) are required",
		);
	}

	try {
		const comparison = await comparisonEngine.compare({
			prompt,
			models,
			organizationId: ctx.organizationId,
		});

		const match = await arenaMatchesService.createArenaMatch(
			ctx.organizationId,
			{ prompt, models, judgeConfigId },
			ctx.userId,
		);

		return NextResponse.json(
			{
				matchId: match.id,
				winner: { modelId: match.winnerId, label: match.winnerLabel },
				responses: comparison.responses,
				scores: match.scores,
			},
			{ status: 201 },
		);
	} catch (error) {
		logger.error("Failed to compare arena models", {
			error,
			route: "/api/arena/compare",
			method: "POST",
		});
		return internalError(error instanceof Error ? error.message : undefined);
	}
});
