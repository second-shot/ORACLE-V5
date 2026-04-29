import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PricingOutput } from "../components/PricingOutput.jsx";

function makePricingOutput(overrides = {}) {
  return {
    kind: "oracle-pricing",
    title: "resale · execute",
    diagnosis: "Resale intent confirmed · triage and route.",
    itemType: "bike",
    primaryRoute: "Facebook Marketplace",
    secondaryRoute: "eBay — if no enquiry in 48 hours",
    priceNote: "Search Facebook Marketplace for the same model locally. Undercut by 10–15%.",
    floor: "Accept any firm offer above scrap value if deadline is hard.",
    prep: [
      "Clean the bike thoroughly.",
      "Photograph outdoors — both sides.",
      "Include make, model, frame size.",
    ],
    timeToSale: "24–72 hours (fast-sale priority)",
    reason: "Hard deadline detected — speed over maximum price. urgency 4 + value 4 = 8.",
    ...overrides,
  };
}

describe("PricingOutput", () => {
  it("renders nothing when output is null", () => {
    const { container } = render(<PricingOutput output={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the primary route", () => {
    render(<PricingOutput output={makePricingOutput()} />);
    expect(screen.getByText("Facebook Marketplace")).toBeInTheDocument();
  });

  it("renders the secondary route", () => {
    render(<PricingOutput output={makePricingOutput()} />);
    expect(screen.getByText("eBay — if no enquiry in 48 hours")).toBeInTheDocument();
  });

  it("renders the price note", () => {
    render(<PricingOutput output={makePricingOutput()} />);
    expect(
      screen.getByText(/Undercut by 10–15%/)
    ).toBeInTheDocument();
  });

  it("renders the floor text", () => {
    render(<PricingOutput output={makePricingOutput()} />);
    expect(screen.getByText(/scrap value/)).toBeInTheDocument();
  });

  it("renders all prep steps as list items", () => {
    render(<PricingOutput output={makePricingOutput()} />);
    expect(screen.getByText("Clean the bike thoroughly.")).toBeInTheDocument();
    expect(screen.getByText("Photograph outdoors — both sides.")).toBeInTheDocument();
    expect(screen.getByText("Include make, model, frame size.")).toBeInTheDocument();
  });

  it("renders the time to sale", () => {
    render(<PricingOutput output={makePricingOutput()} />);
    expect(screen.getByText(/fast-sale priority/)).toBeInTheDocument();
  });

  it("renders the reason", () => {
    render(<PricingOutput output={makePricingOutput()} />);
    expect(screen.getByText(/Hard deadline detected/)).toBeInTheDocument();
  });

  it("renders with a different item type correctly", () => {
    render(
      <PricingOutput
        output={makePricingOutput({
          primaryRoute: "eBay",
          secondaryRoute: "Depop — if no sale in 5 days",
          priceNote: "Search eBay sold listings.",
        })}
      />
    );
    expect(screen.getByText("eBay")).toBeInTheDocument();
    expect(screen.getByText("Depop — if no sale in 5 days")).toBeInTheDocument();
  });

  it("renders prep as an ordered list", () => {
    const { container } = render(<PricingOutput output={makePricingOutput()} />);
    const ol = container.querySelector("ol");
    expect(ol).not.toBeNull();
    const items = ol.querySelectorAll("li");
    expect(items).toHaveLength(3);
  });

  it("renders all required label fields", () => {
    render(<PricingOutput output={makePricingOutput()} />);
    expect(screen.getByText("Recommended route")).toBeInTheDocument();
    expect(screen.getByText("If no traction")).toBeInTheDocument();
    expect(screen.getByText("Set price")).toBeInTheDocument();
    expect(screen.getByText("Floor")).toBeInTheDocument();
    expect(screen.getByText("Preparation")).toBeInTheDocument();
    expect(screen.getByText("Time to sale")).toBeInTheDocument();
  });
});
