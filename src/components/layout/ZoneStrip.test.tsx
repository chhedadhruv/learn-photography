import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ZoneStrip } from "./ZoneStrip";

describe("ZoneStrip", () => {
  it("renders all eleven zones", () => {
    const { container } = render(<ZoneStrip />);

    expect(container.querySelectorAll("span")).toHaveLength(11);
  });

  it("is decorative, so screen readers skip it", () => {
    const { container } = render(<ZoneStrip />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("runs black to white in order, without repeating a step", () => {
    const { container } = render(<ZoneStrip />);
    const backgrounds = [...container.querySelectorAll("span")].map(
      (span) => span.getAttribute("style") ?? "",
    );

    expect(backgrounds[0]).toContain("--color-zone-0");
    expect(backgrounds[10]).toContain("--color-zone-10");
    expect(new Set(backgrounds).size).toBe(11);
  });
});
