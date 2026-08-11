import { DIAGNOSE_EXERCISES } from "@content/challenges/diagnose";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DiagnoseTheMistake } from "./DiagnoseTheMistake";

/**
 * The renderer needs WebGL, which jsdom does not have, so it is stubbed. Everything these tests
 * care about is the surrounding component: whether the canvas is given a chance to render at all.
 */
vi.mock("./render/Viewfinder", () => ({
  Viewfinder: () => <div data-testid="viewfinder" />,
}));

const exercise = DIAGNOSE_EXERCISES[0];

/** Walks up the tree looking for anything that would stop the canvas being laid out. */
function isRenderable(element: HTMLElement): boolean {
  let node: HTMLElement | null = element;

  while (node) {
    if (node.classList.contains("hidden")) return false;
    if (node.style.display === "none") return false;
    node = node.parentElement;
  }

  return true;
}

describe("DiagnoseTheMistake", () => {
  /**
   * The bug this exists to prevent: the viewfinder used to sit inside a `hidden` wrapper while
   * the fault was being diagnosed. `display: none` gives a canvas zero size, so it never renders,
   * so the still it is supposed to produce never arrives — and the placeholder waits on itself
   * forever. The canvas must stay laid out and be covered instead.
   */
  it("keeps the viewfinder laid out while the still is still developing", () => {
    expect(exercise).toBeDefined();
    if (!exercise) return;

    render(<DiagnoseTheMistake exercise={exercise} />);

    const viewfinder = screen.getByTestId("viewfinder");
    expect(
      isRenderable(viewfinder),
      "the viewfinder is inside a display:none ancestor, so it can never produce the still",
    ).toBe(true);
  });

  it("shows the developing placeholder until the still arrives", () => {
    if (!exercise) return;
    render(<DiagnoseTheMistake exercise={exercise} />);

    expect(screen.getByText(/developing/i)).toBeInTheDocument();
  });

  it("asks the question and offers every option", () => {
    if (!exercise) return;
    render(<DiagnoseTheMistake exercise={exercise} />);

    expect(screen.getByText(/what went wrong/i)).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(exercise.distractors.length + 1);
  });

  it("will not accept an answer until one is chosen", () => {
    if (!exercise) return;
    render(<DiagnoseTheMistake exercise={exercise} />);

    expect(screen.getByRole("button", { name: /check my answer/i })).toBeDisabled();
  });

  it("keeps the viewfinder laid out after answering, too", async () => {
    if (!exercise) return;
    const user = userEvent.setup();
    render(<DiagnoseTheMistake exercise={exercise} />);

    const [firstOption] = screen.getAllByRole("radio");
    expect(firstOption).toBeDefined();
    if (!firstOption) return;

    await user.click(firstOption);
    await user.click(screen.getByRole("button", { name: /check my answer/i }));

    expect(isRenderable(screen.getByTestId("viewfinder"))).toBe(true);
  });

  it("reveals the explanation only after the question is answered", async () => {
    if (!exercise) return;
    const user = userEvent.setup();
    render(<DiagnoseTheMistake exercise={exercise} />);

    // Showing the fault before it is named would answer the question for the reader.
    expect(screen.queryByText(/fix it with/i)).not.toBeInTheDocument();

    const [firstOption] = screen.getAllByRole("radio");
    expect(firstOption).toBeDefined();
    if (!firstOption) return;

    await user.click(firstOption);
    await user.click(screen.getByRole("button", { name: /check my answer/i }));

    expect(screen.getByText(/fix it with/i)).toBeInTheDocument();
  });
});
