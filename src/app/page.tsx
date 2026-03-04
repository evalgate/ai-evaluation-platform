import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { HomeFeatures } from "@/components/home-features";
import { HomeHeader } from "@/components/home-header";
import { HomeHero } from "@/components/home-hero";
import { HomeScreenshots } from "@/components/home-screenshots";
import { InteractivePlayground } from "@/components/interactive-playground";

export const metadata: Metadata = {
	title: "EvalGate - AI Quality Infrastructure",
	description:
		"Production failures automatically become regression tests. CI for AI behavior plus production trace collection, failure detection, and auto-generated test cases. TypeScript & Python SDKs.",
	openGraph: {
		title: "EvalGate - AI Quality Infrastructure",
		description:
			"Production failures automatically become regression tests. CI for AI behavior plus production trace collection and auto-generated test cases.",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "EvalGate - AI Quality Infrastructure",
		description:
			"Production failures automatically become regression tests. CI for AI behavior plus production trace collection and auto-generated test cases.",
	},
};

export default function HomePage() {
	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col">
			<HomeHeader />

			<main className="flex-1">
				<HomeHero />
				<HomeFeatures />
				<HomeScreenshots />

				{/* Interactive Playground Section */}
				<section
					id="playground"
					className="py-16 sm:py-20 bg-background scroll-mt-16"
				>
					<div className="container mx-auto px-4">
						<InteractivePlayground />
					</div>
				</section>
			</main>

			<Footer />
		</div>
	);
}
