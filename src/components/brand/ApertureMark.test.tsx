import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApertureMark } from "./ApertureMark";

describe("ApertureMark", () => {
  it("is announced as an image with the site name by default", () => {
    render(<ApertureMark />);

    expect(screen.getByRole("img", { name: "Learn Photography" })).toBeInTheDocument();
  });

  it("is hidden from assistive tech when it sits beside the wordmark", () => {
    const { container } = render(<ApertureMark decorative />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("inherits text colour so one file serves both themes", () => {
    const { container } = render(<ApertureMark />);

    expect(container.querySelector("svg")).toHaveAttribute("stroke", "currentColor");
  });

  it("scales from the same 24-unit grid at any size", () => {
    const { container } = render(<ApertureMark size={64} />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("width", "64");
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
  });
});
