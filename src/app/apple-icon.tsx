import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
				borderRadius: 40,
			}}
		>
			<span
				style={{
					fontSize: 120,
					fontWeight: 700,
					color: "white",
					fontFamily: "system-ui, sans-serif",
				}}
			>
				E
			</span>
		</div>,
		{ ...size },
	);
}
