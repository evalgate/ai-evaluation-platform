import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { PersistedEvalgateArtifact } from "./evalgate-types";
import {
	formatArtifactKind,
	formatArtifactSummaryValue,
} from "./evalgate-utils";

interface EvalgateArtifactDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	artifact: PersistedEvalgateArtifact | null;
}

export function EvalgateArtifactDialog({
	open,
	onOpenChange,
	artifact,
}: EvalgateArtifactDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
				{artifact ? (
					<>
						<DialogHeader>
							<DialogTitle>{artifact.title}</DialogTitle>
							<DialogDescription>
								{formatArtifactKind(artifact.kind)}
								{artifact.evaluationRunId
									? ` • Run #${artifact.evaluationRunId}`
									: ""}
								{` • ${new Date(artifact.createdAt).toLocaleString()}`}
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4">
							<div>
								<p className="mb-2 text-sm font-medium">Summary</p>
								<div className="flex flex-wrap gap-2">
									{Object.entries(artifact.summary ?? {}).map(
										([key, value]) => (
											<span
												key={key}
												className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground"
											>
												{`${key
													.replace(/([A-Z])/g, " $1")
													.replace(/_/g, " ")
													.trim()}: ${formatArtifactSummaryValue(value)}`}
											</span>
										),
									)}
								</div>
							</div>

							<div>
								<p className="mb-2 text-sm font-medium">Metadata</p>
								<pre className="max-h-56 overflow-auto rounded bg-muted p-3 text-xs">
									{JSON.stringify(artifact.metadata ?? {}, null, 2)}
								</pre>
							</div>

							<div>
								<p className="mb-2 text-sm font-medium">Payload</p>
								<pre className="max-h-96 overflow-auto rounded bg-muted p-3 text-xs">
									{JSON.stringify(artifact.payload ?? {}, null, 2)}
								</pre>
							</div>
						</div>
					</>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
