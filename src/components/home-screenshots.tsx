"use client";

import Image from "next/image";
import { memo, useState } from "react";
import { cn } from "@/lib/utils";

// 4 strongest screens — Dashboard, Evaluations, Traces, Cost Analytics
const SCREENSHOTS = [
	{
		id: "dashboard",
		label: "Dashboard",
		src: "/screenshots/dashboard.png",
		description: "At-a-glance stats, recent runs, and quick actions",
	},
	{
		id: "evaluations",
		label: "Evaluations",
		src: "/screenshots/evaluations.png",
		description: "Manage test suites with type filters and pass rates",
	},
	{
		id: "traces",
		label: "Traces",
		src: "/screenshots/traces.png",
		description: "Waterfall timeline for every LLM call and tool span",
	},
	{
		id: "costs",
		label: "Cost Analytics",
		src: "/screenshots/costs.png",
		description: "Spend trends, model breakdown, and spike detection",
	},
] as const;

export const HomeScreenshots = memo(function HomeScreenshots() {
	const [active, setActive] = useState(0);

	return (
		<section className="py-16 sm:py-20 bg-background">
			<div className="container mx-auto px-4">
				<h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
					See It in Action
				</h2>
				<p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
					Every screen built for speed, clarity, and actionable insight
				</p>

				<div className="flex flex-wrap justify-center gap-2 mb-8">
					{SCREENSHOTS.map((s, i) => (
						<button
							key={s.id}
							type="button"
							onClick={() => setActive(i)}
							className={cn(
								"px-4 py-2 rounded-lg text-sm font-medium transition-colors",
								active === i
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground hover:bg-muted/80",
							)}
						>
							{s.label}
						</button>
					))}
				</div>

				<div className="relative max-w-5xl mx-auto">
					<div className="rounded-xl overflow-hidden border border-border shadow-2xl">
						<Image
							src={SCREENSHOTS[active].src}
							alt={SCREENSHOTS[active].label}
							width={1920}
							height={1080}
							className="w-full h-auto"
							priority={active === 0}
						/>
					</div>
					<p className="text-center text-muted-foreground mt-4 text-sm">
						{SCREENSHOTS[active].description}
					</p>
				</div>
			</div>
		</section>
	);
});
