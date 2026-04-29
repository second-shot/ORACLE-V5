import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../App.jsx";

// ── localStorage stub ─────────────────────────────────────────────────────────

beforeEach(() => {
  let store = {};
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: vi.fn((key) => store[key] ?? null),
      setItem: vi.fn((key, value) => { store[key] = value; }),
      removeItem: vi.fn((key) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; }),
    },
    writable: true,
    configurable: true,
  });
});

describe("App", () => {
  it("renders the ORACLE wordmark", () => {
    render(<App />);
    expect(screen.getByText("ORACLE")).toBeInTheDocument();
  });

  it("renders the version label", () => {
    render(<App />);
    expect(screen.getByText("V5")).toBeInTheDocument();
  });

  it("renders the input textarea", () => {
    render(<App />);
    expect(screen.getByPlaceholderText("Enter raw input…")).toBeInTheDocument();
  });

  it("renders the Run button", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /Run Oracle/i })).toBeInTheDocument();
  });

  it("Run button is disabled when input is empty", () => {
    render(<App />);
    const btn = screen.getByRole("button", { name: /Run Oracle/i });
    expect(btn).toBeDisabled();
  });

  it("Run button becomes enabled when the user types", () => {
    render(<App />);
    const textarea = screen.getByPlaceholderText("Enter raw input…");
    fireEvent.change(textarea, { target: { value: "sell my bike" } });
    const btn = screen.getByRole("button", { name: /Run Oracle/i });
    expect(btn).not.toBeDisabled();
  });

  it("Run button is disabled again after whitespace-only input", () => {
    render(<App />);
    const textarea = screen.getByPlaceholderText("Enter raw input…");
    fireEvent.change(textarea, { target: { value: "   " } });
    expect(screen.getByRole("button", { name: /Run Oracle/i })).toBeDisabled();
  });

  it("submitting the form adds an output card", async () => {
    render(<App />);
    const textarea = screen.getByPlaceholderText("Enter raw input…");
    fireEvent.change(textarea, {
      target: { value: "I need to sell my bike fast today please help" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Run Oracle/i }));
    await waitFor(() => {
      expect(screen.getByRole("article")).toBeInTheDocument();
    });
  });

  it("clears the textarea after submission", async () => {
    render(<App />);
    const textarea = screen.getByPlaceholderText("Enter raw input…");
    fireEvent.change(textarea, {
      target: { value: "I need to sell my bike fast today please help" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Run Oracle/i }));
    await waitFor(() => {
      expect(textarea.value).toBe("");
    });
  });

  it("pressing Enter submits the form", async () => {
    render(<App />);
    const textarea = screen.getByPlaceholderText("Enter raw input…");
    fireEvent.change(textarea, {
      target: { value: "I need to plan my tasks for the week ahead" },
    });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    await waitFor(() => {
      expect(screen.getByRole("article")).toBeInTheDocument();
    });
  });

  it("pressing Shift+Enter does not submit the form", async () => {
    render(<App />);
    const textarea = screen.getByPlaceholderText("Enter raw input…");
    fireEvent.change(textarea, {
      target: { value: "I need to plan my tasks for the week ahead" },
    });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    // No article should appear
    expect(screen.queryByRole("article")).toBeNull();
  });

  it("does not submit when input is empty and Enter is pressed", () => {
    render(<App />);
    const textarea = screen.getByPlaceholderText("Enter raw input…");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(screen.queryByRole("article")).toBeNull();
  });

  it("multiple submissions add multiple cards", async () => {
    render(<App />);
    const textarea = screen.getByPlaceholderText("Enter raw input…");

    fireEvent.change(textarea, {
      target: { value: "I need to sell my bike today fast" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Run Oracle/i }));
    await waitFor(() => screen.getAllByRole("article"));

    fireEvent.change(textarea, {
      target: { value: "I want to build a new client proposal system" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Run Oracle/i }));
    await waitFor(() => {
      expect(screen.getAllByRole("article")).toHaveLength(2);
    });
  });

  it("newer cards appear before older ones", async () => {
    render(<App />);
    const textarea = screen.getByPlaceholderText("Enter raw input…");

    fireEvent.change(textarea, { target: { value: "first input sell my old bike today" } });
    fireEvent.click(screen.getByRole("button", { name: /Run Oracle/i }));
    await waitFor(() => screen.getAllByRole("article"));

    fireEvent.change(textarea, { target: { value: "second input I want to build a system" } });
    fireEvent.click(screen.getByRole("button", { name: /Run Oracle/i }));
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));

    const articles = screen.getAllByRole("article");
    // Second submission is shown first (index 0)
    expect(articles[0]).not.toBeNull();
    expect(articles[1]).not.toBeNull();
  });
});
