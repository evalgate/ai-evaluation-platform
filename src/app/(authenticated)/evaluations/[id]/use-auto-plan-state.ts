import { useState } from "react";
import { toast } from "sonner";
import type { AutoPlanPreview } from "./evalgate-types";
import { parseListInput, parseOptionalIntegerInput } from "./evalgate-utils";

export function useAutoPlanState() {
	const [autoPlanObjectiveInput, setAutoPlanObjectiveInput] = useState("");
	const [autoPlanTargetPathInput, setAutoPlanTargetPathInput] = useState("");
	const [autoPlanTargetContentInput, setAutoPlanTargetContentInput] =
		useState("");
	const [autoPlanAllowedFamiliesInput, setAutoPlanAllowedFamiliesInput] =
		useState("few-shot-examples, instruction-order");
	const [autoPlanHypothesisInput, setAutoPlanHypothesisInput] = useState("");
	const [autoPlanForbiddenChangesInput, setAutoPlanForbiddenChangesInput] =
		useState("");
	const [autoPlanIterationInput, setAutoPlanIterationInput] = useState("1");
	const [autoPlanPreview, setAutoPlanPreview] =
		useState<AutoPlanPreview | null>(null);
	const [autoPlanLoading, setAutoPlanLoading] = useState(false);

	const resetAutoPlanPreview = () => {
		setAutoPlanPreview(null);
	};

	const generateAutoPlanPreview = async () => {
		if (!autoPlanObjectiveInput.trim()) {
			toast.error("Objective is required for auto planning.");
			return;
		}
		if (!autoPlanTargetPathInput.trim()) {
			toast.error("Target path is required for auto planning.");
			return;
		}
		if (!autoPlanTargetContentInput.trim()) {
			toast.error("Target content is required for auto planning.");
			return;
		}

		setAutoPlanLoading(true);
		try {
			const iteration =
				parseOptionalIntegerInput(
					autoPlanIterationInput,
					"Iteration",
					1,
					100,
				) ?? 1;
			const allowedFamilies = parseListInput(autoPlanAllowedFamiliesInput);
			if (!allowedFamilies || allowedFamilies.length === 0) {
				throw new Error("At least one mutation family is required.");
			}
			const forbiddenChanges = parseListInput(autoPlanForbiddenChangesInput);
			const response = await fetch(`/api/evalgate/auto-plan`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					iteration,
					objective: autoPlanObjectiveInput,
					targetPath: autoPlanTargetPathInput,
					targetContent: autoPlanTargetContentInput,
					allowedFamilies,
					hypothesis: autoPlanHypothesisInput.trim() || undefined,
					forbiddenChanges,
				}),
			});
			const data = (await response.json()) as
				| ({ error?: { message?: string } } & Partial<AutoPlanPreview>)
				| undefined;

			if (!response.ok) {
				throw new Error(
					data?.error?.message ?? "Failed to generate auto planner preview.",
				);
			}

			setAutoPlanPreview(data as AutoPlanPreview);
			toast.success("Generated auto planner preview");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to generate auto planner preview.",
			);
		} finally {
			setAutoPlanLoading(false);
		}
	};

	return {
		autoPlanObjectiveInput,
		autoPlanTargetPathInput,
		autoPlanTargetContentInput,
		autoPlanAllowedFamiliesInput,
		autoPlanHypothesisInput,
		autoPlanForbiddenChangesInput,
		autoPlanIterationInput,
		autoPlanPreview,
		autoPlanLoading,
		setAutoPlanObjectiveInput: (value: string) => {
			setAutoPlanObjectiveInput(value);
			resetAutoPlanPreview();
		},
		setAutoPlanTargetPathInput: (value: string) => {
			setAutoPlanTargetPathInput(value);
			resetAutoPlanPreview();
		},
		setAutoPlanTargetContentInput: (value: string) => {
			setAutoPlanTargetContentInput(value);
			resetAutoPlanPreview();
		},
		setAutoPlanAllowedFamiliesInput: (value: string) => {
			setAutoPlanAllowedFamiliesInput(value);
			resetAutoPlanPreview();
		},
		setAutoPlanHypothesisInput: (value: string) => {
			setAutoPlanHypothesisInput(value);
			resetAutoPlanPreview();
		},
		setAutoPlanForbiddenChangesInput: (value: string) => {
			setAutoPlanForbiddenChangesInput(value);
			resetAutoPlanPreview();
		},
		setAutoPlanIterationInput: (value: string) => {
			setAutoPlanIterationInput(value);
			resetAutoPlanPreview();
		},
		generateAutoPlanPreview,
	};
}
