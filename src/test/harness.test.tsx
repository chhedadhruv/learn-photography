import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * Guards the test setup itself. If the React plugin, the jsdom environment or the jest-dom
 * matcher registration in `vitest.setup.ts` ever breaks, this fails loudly rather than every
 * other suite failing for a misleading reason.
 */
describe("test harness", () => {
  it("renders React components into a DOM", () => {
    render(<p>aperture</p>);

    expect(screen.getByText("aperture")).toBeInTheDocument();
  });

  it("registers jest-dom matchers", () => {
    render(
      <button type="button" disabled>
        capture
      </button>,
    );

    expect(screen.getByRole("button", { name: "capture" })).toBeDisabled();
  });
});
