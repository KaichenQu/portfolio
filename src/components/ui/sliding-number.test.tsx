import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SlidingNumber } from "./sliding-number";

// Each digit wheel is the only element carrying `tabular-nums`.
const digits = (c: HTMLElement) => c.querySelectorAll("span.tabular-nums");

describe("SlidingNumber", () => {
  it("renders one digit wheel per digit of the value", () => {
    const { container } = render(<SlidingNumber value={42} />);
    expect(digits(container)).toHaveLength(2);
  });

  it("renders every 0-9 candidate inside each digit wheel", () => {
    const { container } = render(<SlidingNumber value={7} />);
    const wheel = digits(container)[0];
    expect(wheel.textContent).toContain("0123456789");
  });

  it("pads a single-digit value to two wheels when padStart is set", () => {
    const { container } = render(<SlidingNumber value={7} padStart />);
    expect(digits(container)).toHaveLength(2);
  });

  it("does not pad when padStart is off", () => {
    const { container } = render(<SlidingNumber value={7} />);
    expect(digits(container)).toHaveLength(1);
  });

  it("does not pad a value that is already two digits", () => {
    const { container } = render(<SlidingNumber value={12} padStart />);
    expect(digits(container)).toHaveLength(2);
  });

  it("prefixes a minus sign for negative values and uses the absolute value", () => {
    const { container } = render(<SlidingNumber value={-5} />);
    expect(container.textContent?.startsWith("-")).toBe(true);
    expect(digits(container)).toHaveLength(1);
  });

  it("renders the separator and decimal wheels for a fractional value", () => {
    const { container } = render(<SlidingNumber value={1.25} decimalSeparator="," />);
    expect(container.textContent).toContain(",");
    expect(digits(container)).toHaveLength(3);
  });
});
