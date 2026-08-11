import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SiteHeader } from "./SiteHeader";

vi.mock("next/navigation", () => ({
  usePathname: () => "/learn",
}));

const renderHeader = () =>
  render(
    <ThemeProvider>
      <SiteHeader />
    </ThemeProvider>,
  );

describe("SiteHeader", () => {
  it("marks the section the reader is in as the current page", () => {
    renderHeader();

    const learn = screen.getAllByRole("link", { name: "Learn" })[0];
    expect(learn).toHaveAttribute("aria-current", "page");
  });

  it("treats a lesson inside a section as still being in that section", () => {
    // usePathname is mocked to /learn; the header also matches nested routes via startsWith,
    // so a lesson page keeps its section highlighted rather than losing the marker.
    renderHeader();

    expect(screen.getAllByRole("link", { name: "Practice" })[0]).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("reports the mobile menu's state to assistive tech as it opens and closes", async () => {
    const user = userEvent.setup();
    renderHeader();

    const toggle = screen.getByRole("button", { name: "Menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Close" })).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the mobile menu on Escape", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.keyboard("{Escape}");

    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
  });
});
