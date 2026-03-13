"use client";

import { AlertCircle } from "lucide-react";
import React, { type ErrorInfo, type ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface TabErrorBoundaryProps {
	children: ReactNode;
	label: string;
	resetKeys?: Array<string | number | null | undefined>;
}

interface TabErrorBoundaryState {
	hasError: boolean;
}

export class TabErrorBoundary extends React.Component<
	TabErrorBoundaryProps,
	TabErrorBoundaryState
> {
	state: TabErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): TabErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

	componentDidUpdate(prevProps: TabErrorBoundaryProps) {
		const currentReset = JSON.stringify(this.props.resetKeys ?? []);
		const previousReset = JSON.stringify(prevProps.resetKeys ?? []);
		if (this.state.hasError && currentReset !== previousReset) {
			this.setState({ hasError: false });
		}
	}

	render() {
		if (this.state.hasError) {
			return (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>{this.props.label} unavailable</AlertTitle>
					<AlertDescription>
						<p>
							This tab hit an unexpected error. You can retry without leaving
							the page.
						</p>
						<Button
							variant="outline"
							size="sm"
							onClick={() => this.setState({ hasError: false })}
						>
							Retry tab
						</Button>
					</AlertDescription>
				</Alert>
			);
		}

		return this.props.children;
	}
}
