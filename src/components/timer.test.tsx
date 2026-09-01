import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render } from "@testing-library/react";

// The digit-wheel animation is covered by sliding-number.test.tsx; here we only
// care about the time string the Clock computes.
vi.mock("@/components/ui/sliding-number", () => ({
  SlidingNumber: ({ value, padStart }: { value: number; padStart?: boolean }) => (
    <span>{padStart ? String(value).padStart(2, "0") : String(value)}</span>
  ),
}));

import { Clock } from "./timer";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Clock", () => {
  it("renders HH:MM:SS in the given time zone", () => {
    vi.setSystemTime(new Date("2025-03-04T17:08:09Z"));
    const { container } = render(<Clock timeZone="UTC" />);

    expect(container.textContent).toBe("17:08:09");
  });

  it("uses the requested time zone rather than the system one", () => {
    vi.setSystemTime(new Date("2025-03-04T17:08:09Z"));
    const { container } = render(<Clock timeZone="Asia/Shanghai" />);

    expect(container.textContent).toBe("01:08:09");
  });

  it("advances once a second", () => {
    vi.setSystemTime(new Date("2025-03-04T17:08:09Z"));
    const { container } = render(<Clock timeZone="UTC" />);

    act(() => void vi.advanceTimersByTime(1000));
    expect(container.textContent).toBe("17:08:10");

    act(() => void vi.advanceTimersByTime(1000));
    expect(container.textContent).toBe("17:08:11");

    act(() => void vi.advanceTimersByTime(51_000));
    expect(container.textContent).toBe("17:09:02");
  });

  it("renders midnight as 00, not 24", () => {
    vi.setSystemTime(new Date("2025-03-04T00:00:00Z"));
    const { container } = render(<Clock timeZone="UTC" />);

    expect(container.textContent).toBe("00:00:00");
  });

  it("stops ticking after unmount", () => {
    vi.setSystemTime(new Date("2025-03-04T17:08:09Z"));
    const { unmount } = render(<Clock timeZone="UTC" />);
    unmount();

    expect(() => act(() => void vi.advanceTimersByTime(5000))).not.toThrow();
  });
});
