import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Breadcrumbs } from "./Breadcrumbs";

const CRUMBS = [
  { href: "/", label: "Home" },
  { href: "/learn", label: "Learn" },
  { href: "/learn/exposure-triangle", label: "The exposure triangle" },
];

describe("Breadcrumbs", () => {
  it("marks only the final crumb as the current page", () => {
    render(<Breadcrumbs crumbs={CRUMBS} />);

    const current = screen.getByText("The exposure triangle");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current.tagName).toBe("SPAN");
  });

  it("links every crumb except the current page", () => {
    render(<Breadcrumbs crumbs={CRUMBS} />);

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Learn" })).toHaveAttribute("href", "/learn");
    expect(screen.queryByRole("link", { name: "The exposure triangle" })).not.toBeInTheDocument();
  });

  it("renders nothing rather than an empty landmark when there are no crumbs", () => {
    render(<Breadcrumbs crumbs={[]} />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
