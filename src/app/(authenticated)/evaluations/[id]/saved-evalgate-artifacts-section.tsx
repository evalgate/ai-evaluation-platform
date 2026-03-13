import { Check, Loader2, Trash2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { PersistedEvalgateArtifact } from "./evalgate-types";
import { formatArtifactKind, summarizeArtifact } from "./evalgate-utils";

interface SavedEvalgateArtifactsSectionProps {
	artifacts: PersistedEvalgateArtifact[];
	artifactsLoading: boolean;
	deletingArtifactId?: number | null;
	acceptingArtifactId?: number | null;
	onRefresh: () => void;
	onOpenArtifact: (artifact: PersistedEvalgateArtifact) => void;
	onDeleteArtifact: (
		artifact: PersistedEvalgateArtifact,
	) => void | Promise<void>;
	onAcceptSynthesisArtifact: (
		artifact: PersistedEvalgateArtifact,
	) => void | Promise<void>;
}

export function SavedEvalgateArtifactsSection({
	artifacts,
	artifactsLoading,
	deletingArtifactId,
	acceptingArtifactId,
	onRefresh,
	onOpenArtifact,
	onDeleteArtifact,
	onAcceptSynthesisArtifact,
}: SavedEvalgateArtifactsSectionProps) {
	return (
		<div>
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg sm:text-xl font-semibold">
						Saved EvalGate Artifacts
					</h2>
					<p className="text-sm text-muted-foreground">
						Persisted datasets, analyses, clusters, syntheses, and diversity
						reports.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={onRefresh}
					disabled={artifactsLoading}
				>
					{artifactsLoading ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : null}
					Refresh
				</Button>
			</div>

			{artifactsLoading && artifacts.length === 0 ? (
				<div className="grid gap-3 lg:grid-cols-2">
					{["artifact-skeleton-1", "artifact-skeleton-2"].map((skeletonKey) => (
						<Card key={skeletonKey}>
							<CardContent className="space-y-3 p-4">
								<Skeleton className="h-4 w-2/3" />
								<Skeleton className="h-4 w-1/2" />
								<Skeleton className="h-16 w-full" />
							</CardContent>
						</Card>
					))}
				</div>
			) : artifacts.length > 0 ? (
				<div className="grid gap-3 lg:grid-cols-2">
					{artifacts.map((artifact) => (
						<Card key={artifact.id}>
							<CardContent className="p-4">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium">
											{artifact.title}
										</p>
										<div className="mt-1 flex flex-wrap items-center gap-2">
											<Badge variant="outline">
												{formatArtifactKind(artifact.kind)}
											</Badge>
											{artifact.evaluationRunId ? (
												<Badge variant="outline">
													Run #{artifact.evaluationRunId}
												</Badge>
											) : null}
											<span className="text-xs text-muted-foreground">
												{new Date(artifact.createdAt).toLocaleString()}
											</span>
										</div>
										<div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
											{summarizeArtifact(artifact.summary).map((item) => (
												<span
													key={`${artifact.id}-${item}`}
													className="rounded bg-muted px-2 py-1"
												>
													{item}
												</span>
											))}
										</div>
									</div>
									<div className="flex flex-col items-end gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => onOpenArtifact(artifact)}
										>
											Open
										</Button>
										{artifact.kind === "synthesis" ? (
											<Button
												variant="secondary"
												size="sm"
												onClick={() => void onAcceptSynthesisArtifact(artifact)}
												disabled={acceptingArtifactId === artifact.id}
											>
												{acceptingArtifactId === artifact.id ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<Check className="mr-2 h-4 w-4" />
												)}
												Accept Cases
											</Button>
										) : null}
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button
													variant="ghost"
													size="sm"
													className="text-destructive"
												>
													<Trash2 className="mr-2 h-4 w-4" />
													Delete
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>Delete artifact?</AlertDialogTitle>
													<AlertDialogDescription>
														This removes the saved EvalGate artifact from this
														evaluation.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction
														onClick={() => void onDeleteArtifact(artifact)}
														disabled={deletingArtifactId === artifact.id}
													>
														{deletingArtifactId === artifact.id
															? "Deleting..."
															: "Delete artifact"}
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No persisted EvalGate artifacts yet.</EmptyTitle>
						<EmptyDescription>
							Run analysis, clustering, synthesis, or diversity preview and save
							the results here.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button variant="outline" size="sm" onClick={onRefresh}>
							Refresh artifacts
						</Button>
					</EmptyContent>
				</Empty>
			)}
		</div>
	);
}
