import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface PermissionActionButtonProps extends ComponentProps<typeof Button> {
	disabledReason?: string | null;
}

export function PermissionActionButton({
	disabled,
	disabledReason,
	children,
	...props
}: PermissionActionButtonProps) {
	const button = (
		<Button {...props} disabled={disabled}>
			{children}
		</Button>
	);

	if (!disabled || !disabledReason) {
		return button;
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="inline-flex" title={disabledReason}>
					{button}
				</span>
			</TooltipTrigger>
			<TooltipContent>{disabledReason}</TooltipContent>
		</Tooltip>
	);
}
