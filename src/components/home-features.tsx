import {
	Activity,
	Beaker,
	RefreshCw,
	Sparkles,
	Users,
	Zap,
} from "lucide-react";
import { memo } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const FEATURES = [
	{
		icon: RefreshCw,
		title: "AI Reliability Loop",
		description:
			"Production failures automatically become regression tests. Collect traces, detect issues, auto-generate test cases.",
	},
	{
		icon: Beaker,
		title: "CI Regression Gate",
		description:
			"One-command CI pipeline with 50+ assertions, golden regression datasets, and auto-promotion heuristics",
	},
	{
		icon: Activity,
		title: "Production Tracing",
		description:
			"Collect traces from production with idempotent ingest, server-side sampling, and rate-limited analysis",
	},
	{
		icon: Sparkles,
		title: "LLM Judge",
		description:
			"Model-as-a-judge evaluations with custom criteria and multi-judge consensus",
	},
	{
		icon: Users,
		title: "Human Evaluation",
		description:
			"Collect expert feedback and annotations with customizable workflows",
	},
	{
		icon: Zap,
		title: "Observability",
		description: "Real-time tracing and debugging for all your LLM calls",
	},
];

export const HomeFeatures = memo(function HomeFeatures() {
	return (
		<section className="py-16 sm:py-20 bg-muted/50">
			<div className="container mx-auto px-4">
				<h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
					AI Quality Infrastructure
				</h2>
				<p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
					From production traces to CI gates. Node & Python SDKs. Full lifecycle
					AI quality — collect, detect, generate, gate, ship.
				</p>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
					{FEATURES.map((feature) => (
						<Card key={feature.title}>
							<CardHeader>
								<feature.icon className="h-10 w-10 text-primary mb-2" />
								<CardTitle>{feature.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base">
									{feature.description}
								</CardDescription>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
});
