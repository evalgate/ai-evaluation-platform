/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock next-themes
const mockSetTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({ theme: "light", setTheme: mockSetTheme })),
}));

import { ThemeToggle } from "@/components/theme-toggle";

describe("ThemeToggle", () => {
  it("should render a button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toBeDefined();
  });

  it("should have sr-only label for accessibility", () => {
    render(<ThemeToggle />);
    expect(screen.getByText("Toggle theme")).toBeDefined();
  });

  it("should call setTheme on click", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });
});
