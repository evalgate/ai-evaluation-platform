/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock autumn-js/react
const mockUseCustomer = vi.fn();
vi.mock("autumn-js/react", () => ({
  useCustomer: (...args: unknown[]) => mockUseCustomer(...args),
}));

import { PlanUsageIndicator } from "@/components/plan-usage-indicator";

describe("PlanUsageIndicator", () => {
  it("should show loading spinner when isLoading", () => {
    mockUseCustomer.mockReturnValue({ customer: null, isLoading: true });
    render(<PlanUsageIndicator />);
    expect(screen.getByText("Usage & Limits")).toBeDefined();
    expect(screen.getByText("Track your plan usage")).toBeDefined();
  });

  it("should show disabled message when no customer", () => {
    mockUseCustomer.mockReturnValue({ customer: null, isLoading: false });
    render(<PlanUsageIndicator />);
    expect(screen.getByText("Usage tracking temporarily disabled")).toBeDefined();
  });

  it("should show plan name when customer exists", () => {
    mockUseCustomer.mockReturnValue({
      customer: {
        products: [{ name: "Pro" }],
        features: {},
      },
      isLoading: false,
    });
    render(<PlanUsageIndicator />);
    expect(screen.getByText("Pro")).toBeDefined();
  });

  it("should show upgrade CTA for Developer plan", () => {
    mockUseCustomer.mockReturnValue({
      customer: {
        products: [{ name: "Developer" }],
        features: {},
      },
      isLoading: false,
    });
    render(<PlanUsageIndicator />);
    expect(screen.getByText("Upgrade Plan")).toBeDefined();
  });

  it("should show traces usage when feature exists", () => {
    mockUseCustomer.mockReturnValue({
      customer: {
        products: [{ name: "Pro" }],
        features: {
          traces: { usage: 500, included_usage: 1000, balance: 500, unlimited: false },
        },
      },
      isLoading: false,
    });
    render(<PlanUsageIndicator />);
    expect(screen.getByText("Traces")).toBeDefined();
    expect(screen.getByText(/500 traces remaining/)).toBeDefined();
  });

  it("should show 'Unlimited' for unlimited traces", () => {
    mockUseCustomer.mockReturnValue({
      customer: {
        products: [{ name: "Enterprise" }],
        features: {
          traces: { unlimited: true },
        },
      },
      isLoading: false,
    });
    render(<PlanUsageIndicator />);
    expect(screen.getByText("Unlimited")).toBeDefined();
  });
});
