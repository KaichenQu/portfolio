import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NotFound404 } from "./404";

describe("NotFound404", () => {
  it("renders the placeholder message and a decorative illustration", () => {
    const { container } = render(<NotFound404 />);

    expect(screen.getByText("To be continued...")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("renders its children", () => {
    render(
      <NotFound404>
        <button type="button">Go home</button>
      </NotFound404>,
    );

    expect(screen.getByRole("button", { name: "Go home" })).toBeInTheDocument();
  });
});
