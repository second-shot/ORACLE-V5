import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SurfaceCard } from "../components/SurfaceCard.jsx";

function makeObject(overrides = {}) {
  return {
    id: "test-id-001",
    raw: "I need to sell my bike fast this week",
    normalised: "I need to sell my bike fast this week",
    compressed: "I need to sell my bike fast this week",
    classification: {
      intent: "resale",
      objectType: "opportunity",
      domain: "market",
      signals: {
        resale: true,
        build: false,
        creative: false,
        planning: false,
        overwhelmed: false,
        hasQuestion: false,
        fastSale: true,
        lowClarity: false,
      },
    },
    score: { urgency: 4, value: 4, effort: 2, clarity: 4 },
    route: {
      routeState: "execute",
      archiveLayer: "market",
      reasoning: "urgency 4 + value 4 = 8 — above threshold.",
    },
    output: {
      kind: "oracle-decision",
      title: "resale · execute",
      diagnosis: "Single resale item · hard deadline · speed over price.",
      decision: "List the item now. Fastest viable platform first.",
      nextAction: "List on Facebook Marketplace today.",
      reason: "Hard deadline + fast-sale language → speed over price.",
    },
    pipelineLog: [
      { status: "captured", at: 1 },
      { status: "normalised", at: 2 },
      { status: "surfaced", at: 3 },
    ],
    routeLog: [{ routeState: "execute", reasoning: "high score", at: 1 }],
    memoryMatch: null,
    ...overrides,
  };
}

function makePricingObject() {
  return makeObject({
    output: {
      kind: "oracle-pricing",
      title: "resale · execute",
      diagnosis: "Single resale item · hard deadline · speed over price.",
      itemType: "bike",
      primaryRoute: "Facebook Marketplace",
      secondaryRoute: "eBay — if no enquiry in 48 hours",
      priceNote: "Undercut by 10–15%.",
      floor: "Accept any firm offer above scrap value.",
      prep: ["Clean the bike.", "Photograph outdoors."],
      timeToSale: "24–72 hours (fast-sale priority)",
      reason: "Hard deadline detected.",
    },
  });
}

describe("SurfaceCard", () => {
  it("renders nothing when object has no output", () => {
    const { container } = render(<SurfaceCard object={{ ...makeObject(), output: null }} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when object is null/undefined", () => {
    const { container } = render(<SurfaceCard object={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the diagnosis text", () => {
    render(<SurfaceCard object={makeObject()} />);
    expect(
      screen.getByText("Single resale item · hard deadline · speed over price.")
    ).toBeInTheDocument();
  });

  it("renders the route label", () => {
    render(<SurfaceCard object={makeObject()} />);
    expect(screen.getByText("Execute · Resale")).toBeInTheDocument();
  });

  it("renders the nextAction for oracle-decision output", () => {
    render(<SurfaceCard object={makeObject()} />);
    expect(screen.getByText("List on Facebook Marketplace today.")).toBeInTheDocument();
  });

  it("renders PricingOutput component for oracle-pricing output", () => {
    render(<SurfaceCard object={makePricingObject()} />);
    expect(screen.getByText("Facebook Marketplace")).toBeInTheDocument();
    expect(screen.getByText("Recommended route")).toBeInTheDocument();
  });

  it("renders the Inspect toggle button", () => {
    render(<SurfaceCard object={makeObject()} />);
    expect(screen.getByRole("button", { name: /Inspect/i })).toBeInTheDocument();
  });

  it("inspector is initially collapsed (aria-expanded=false)", () => {
    render(<SurfaceCard object={makeObject()} />);
    const btn = screen.getByRole("button", { name: /Inspect/i });
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("expands inspector on button click", () => {
    render(<SurfaceCard object={makeObject()} />);
    const btn = screen.getByRole("button", { name: /Inspect/i });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
  });

  it("shows inspector content after toggle", () => {
    render(<SurfaceCard object={makeObject()} />);
    fireEvent.click(screen.getByRole("button", { name: /Inspect/i }));
    expect(screen.getByText("Intent")).toBeInTheDocument();
    // "resale" appears in both the intent val and the signals text
    expect(screen.getAllByText(/^resale$/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows score pips in the inspector", () => {
    render(<SurfaceCard object={makeObject()} />);
    fireEvent.click(screen.getByRole("button", { name: /Inspect/i }));
    expect(screen.getByText("Urgency")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
    expect(screen.getByText("Effort")).toBeInTheDocument();
    expect(screen.getByText("Clarity")).toBeInTheDocument();
  });

  it("shows the pipeline trace in the inspector", () => {
    render(<SurfaceCard object={makeObject()} />);
    fireEvent.click(screen.getByRole("button", { name: /Inspect/i }));
    expect(screen.getByText(/captured.*normalised.*surfaced/i)).toBeInTheDocument();
  });

  it("shows route reason in the inspector", () => {
    render(<SurfaceCard object={makeObject()} />);
    fireEvent.click(screen.getByRole("button", { name: /Inspect/i }));
    expect(screen.getByText(/urgency 4 \+ value 4/)).toBeInTheDocument();
  });

  it("shows active signals in the inspector", () => {
    render(<SurfaceCard object={makeObject()} />);
    fireEvent.click(screen.getByRole("button", { name: /Inspect/i }));
    expect(screen.getByText("Signals")).toBeInTheDocument();
    expect(screen.getAllByText(/resale/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'low-clarity' signal when lowClarity is true", () => {
    const obj = makeObject({
      classification: {
        intent: "unclear",
        objectType: "input",
        domain: "intake",
        signals: {
          resale: false, build: false, creative: false, planning: false,
          overwhelmed: false, hasQuestion: false, fastSale: false, lowClarity: true,
        },
      },
      output: {
        kind: "oracle-decision",
        title: "unclear · clarify",
        diagnosis: "Input too ambiguous to route — one clarifying question needed.",
        decision: "Clarify before acting.",
        nextAction: "What single outcome matters most right now?",
        reason: "Objective not specific enough to route without guessing.",
      },
    });
    render(<SurfaceCard object={obj} />);
    fireEvent.click(screen.getByRole("button", { name: /Inspect/i }));
    expect(screen.getByText(/low-clarity/)).toBeInTheDocument();
  });

  it("shows memory match label when memoryMatch is provided", () => {
    const obj = makeObject({
      memoryMatch: { objectId: "abc", score: 4, label: "Similar intent: resale / resale" },
    });
    render(<SurfaceCard object={obj} />);
    expect(screen.getByText(/Similar intent: resale/)).toBeInTheDocument();
  });

  it("does not render memory match section when memoryMatch is null", () => {
    render(<SurfaceCard object={makeObject({ memoryMatch: null })} />);
    expect(screen.queryByText(/Related:/)).toBeNull();
  });

  it("collapses inspector again on second button click", () => {
    render(<SurfaceCard object={makeObject()} />);
    const btn = screen.getByRole("button", { name: /Inspect/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("uses object.id for the inspector aria-controls", () => {
    render(<SurfaceCard object={makeObject()} />);
    const btn = screen.getByRole("button", { name: /Inspect/i });
    expect(btn).toHaveAttribute("aria-controls", "inspector-test-id-001");
  });
});
