import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { TestCase } from "./evalgate-types";

interface EvaluationTestCasesSectionProps {
	testCases: TestCase[];
}

export function EvaluationTestCasesSection({
	testCases,
}: EvaluationTestCasesSectionProps) {
	return (
		<div>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
				<h2 className="text-lg sm:text-xl font-semibold">Test Cases</h2>
				<Button variant="outline" size="sm" className="w-full sm:w-auto">
					<Plus className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
					Add Test Case
				</Button>
			</div>

			{testCases.length > 0 ? (
				<div className="space-y-2 sm:space-y-3">
					{testCases.map((testCase) => (
						<Card key={testCase.id}>
							<CardContent className="p-3 sm:p-4">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<h3 className="text-sm sm:text-base font-semibold mb-2">
											{testCase.name || `Test Case ${testCase.id}`}
										</h3>
										<div className="grid gap-2 sm:gap-3 md:grid-cols-2">
											<div>
												<p className="text-xs text-muted-foreground mb-1">
													Input
												</p>
												<pre className="text-xs bg-muted rounded p-2 overflow-x-auto max-h-24">
													{JSON.stringify(testCase.input, null, 2)}
												</pre>
											</div>
											{testCase.expectedOutput ? (
												<div>
													<p className="text-xs text-muted-foreground mb-1">
														Expected Output
													</p>
													<pre className="text-xs bg-muted rounded p-2 overflow-x-auto max-h-24">
														{JSON.stringify(testCase.expectedOutput, null, 2)}
													</pre>
												</div>
											) : null}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Card>
					<CardContent className="py-12 text-center">
						<FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
						<h3 className="text-lg font-semibold mb-2">No test cases yet</h3>
						<p className="text-muted-foreground mb-4">
							Add test cases to start evaluating your AI models
						</p>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Add Test Case
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
