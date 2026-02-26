/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PricingOverageInfo,
  PricingRateLimits,
  StaticPricingCards,
} from "@/components/static-pricing-cards";

describe("StaticPricingCards", () => {
  it("should render all three plan names", () => {
    render(<StaticPricingCards />);
    expect(screen.getByText("Developer")).toBeDefined();
    expect(screen.getByText("Team")).toBeDefined();
    expect(screen.getByText("Professional")).toBeDefined();
  });

  it("should render plan prices", () => {
    render(<StaticPricingCards />);
    expect(screen.getByText("Free")).toBeDefined();
    expect(screen.getByText("$49")).toBeDefined();
    expect(screen.getByText("$99")).toBeDefined();
  });

  it("should show 'Most Popular' badge on Team plan", () => {
    render(<StaticPricingCards />);
    expect(screen.getByText("Most Popular")).toBeDefined();
  });

  it("should render CTA buttons", () => {
    render(<StaticPricingCards />);
    expect(screen.getByText("Get Started Free")).toBeDefined();
    expect(screen.getAllByText("Start Free Trial").length).toBe(2);
  });
});

describe("PricingOverageInfo", () => {
  it("should render overage pricing info", () => {
    render(<PricingOverageInfo />);
    expect(screen.getByText("Overage Pricing")).toBeDefined();
    expect(screen.getByText("Additional Traces")).toBeDefined();
    expect(screen.getByText("Additional Annotations")).toBeDefined();
  });
});

describe("PricingRateLimits", () => {
  it("should render rate limit tiers", () => {
    render(<PricingRateLimits />);
    expect(screen.getByText("API Rate Limits")).toBeDefined();
    expect(screen.getByText("100 requests/hour")).toBeDefined();
    expect(screen.getByText("500 requests/hour")).toBeDefined();
    expect(screen.getByText("1,000 requests/hour")).toBeDefined();
    expect(screen.getByText("Custom limits")).toBeDefined();
  });
});
