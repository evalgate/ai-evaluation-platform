import { AGENT_TEMPLATES } from "./agent";
import { CORE_TEMPLATES } from "./core";
import { EXPERIMENT_TEMPLATES } from "./experiment";
import { HUMAN_TEMPLATES } from "./human";
import { RAG_TEMPLATES } from "./rag";
import { SAFETY_TEMPLATES } from "./safety";
import type { EvaluationTemplate } from "./types";

// Assemble all templates from category files
export const COMPREHENSIVE_TEMPLATES: EvaluationTemplate[] = [
	...CORE_TEMPLATES,
	...SAFETY_TEMPLATES,
	...RAG_TEMPLATES,
	...AGENT_TEMPLATES,
	...HUMAN_TEMPLATES,
	...EXPERIMENT_TEMPLATES,
];

export function getTemplatesByCategory(
	categoryId: string,
): EvaluationTemplate[] {
	return COMPREHENSIVE_TEMPLATES.filter((t) => t.category === categoryId);
}

export function getTemplateById(id: string): EvaluationTemplate | undefined {
	return COMPREHENSIVE_TEMPLATES.find((t) => t.id === id);
}
