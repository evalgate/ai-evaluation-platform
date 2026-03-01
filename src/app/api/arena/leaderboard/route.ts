import { type NextRequest, NextResponse } from "next/server";
import { internalError } from "@/lib/api/errors";
import { type AuthContext, secureRoute } from "@/lib/api/secure-route";
import { logger } from "@/lib/logger";
import { arenaMatchesService } from "@/lib/services/arena-matches.service";
import { parsePaginationParams } from "@/lib/validation";

export const GET = secureRoute(async (req: NextRequest, ctx: AuthContext) => {
	const { searchParams } = new URL(req.url);
	const { limit } = parsePaginationParams(searchParams);
	const days = parseInt(searchParams.get("days") || "30", 10);

	try {
		const leaderboard = await arenaMatchesService.getLeaderboard(
			ctx.organizationId,
			{
				limit,
				timeRange: { days },
			},
		);

		const stats = await arenaMatchesService.getArenaStats(ctx.organizationId);

		return NextResponse.json({ leaderboard, stats });
	} catch (error) {
		logger.error("Failed to get arena leaderboard", {
			error,
			route: "/api/arena/leaderboard",
			method: "GET",
		});
		return internalError(error instanceof Error ? error.message : undefined);
	}
});
