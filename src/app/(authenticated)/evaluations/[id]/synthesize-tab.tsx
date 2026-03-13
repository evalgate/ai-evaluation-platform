import type { ComponentProps } from "react";
import { EvalgateGenerationPanels } from "./evalgate-generation-panels";

type SynthesizeTabProps = ComponentProps<typeof EvalgateGenerationPanels>;

export function SynthesizeTab(props: SynthesizeTabProps) {
	return <EvalgateGenerationPanels {...props} />;
}
