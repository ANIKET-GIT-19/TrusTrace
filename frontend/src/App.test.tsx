import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppRoutes } from "./app/App";
import { StatusBadge } from "./components/ui/StatusBadge";
import { CORE_PRODUCT_RULE, MANDATORY_DISCLAIMER } from "./lib/constants";

// Stub WebGL2 background in jsdom tests while keeping DashBoardBackground.jsx untouched
vi.mock("./components/DashBoardBackground", () => ({
  default: () => <div data-testid="wayglim-bg-stub" aria-hidden="true" />,
}));

function renderRoute(initialEntry: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Tip Autopsy Phase 1 Visual & Shell Foundation", () => {
  it("renders the hero composition matching ui-ux/hero.jpeg with 5 creator panels and non-advisory framing", () => {
    renderRoute("/");

    expect(screen.getByText(/Signal vs\. Noise for Retail Investors/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Think Before You Trust.");
    expect(screen.getByRole("button", { name: /Analyze a Tip/i })).toBeInTheDocument();
    expect(screen.getByText(CORE_PRODUCT_RULE)).toBeInTheDocument();
    expect(screen.getByText(MANDATORY_DISCLAIMER)).toBeInTheDocument();

    // Ensure all 5 hero creator panels are present in desktop strip
    expect(screen.getAllByAltText(/Illustrative finfluencer/i).length).toBeGreaterThanOrEqual(5);
  });

  it("renders the compliant frosted dashboard shell without prohibited mockup labels", () => {
    renderRoute("/dashboard");

    expect(screen.getByTestId("wayglim-bg-stub")).toBeInTheDocument();
    expect(screen.getByText("Dated Market Snapshots · NSE / BSE")).toBeInTheDocument();
    expect(screen.getByText(CORE_PRODUCT_RULE)).toBeInTheDocument();
    expect(screen.getByText(MANDATORY_DISCLAIMER)).toBeInTheDocument();
    expect(screen.getByText("NIFTY 50")).toBeInTheDocument();
    expect(screen.getByText("SENSEX")).toBeInTheDocument();
    expect(screen.getByText("BANKNIFTY")).toBeInTheDocument();

    // Verify mockup violations are strictly absent
    expect(screen.queryByText(/Live Market Data/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Confidence Score/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Past Reports/i)).not.toBeInTheDocument();
  });

  it("renders explicit status text on neutral evidence badges", () => {
    render(
      <div>
        <StatusBadge tone="neutral_ok" label="Within normal range" />
        <StatusBadge tone="attention" label="Needs attention" />
        <StatusBadge tone="unverified" label="Could not verify" />
      </div>
    );

    expect(screen.getByText("Within normal range")).toBeInTheDocument();
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByText("Could not verify")).toBeInTheDocument();
  });
});
