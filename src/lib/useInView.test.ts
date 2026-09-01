import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

const useInViewMock = vi.fn();
vi.mock("react-intersection-observer", () => ({
  useInView: (opts: unknown) => useInViewMock(opts),
}));

const setActiveSection = vi.fn();
let timeOfLastClick = 0;
vi.mock("../containers/active-section", () => ({
  useActiveSectionContext: () => ({ setActiveSection, timeOfLastClick }),
}));

import { useSectionInView } from "./useInView";

const ref = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-01T00:00:10Z"));
  setActiveSection.mockClear();
  useInViewMock.mockClear();
  timeOfLastClick = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useSectionInView", () => {
  it("passes the threshold through to useInView and returns its ref", () => {
    useInViewMock.mockReturnValue({ ref, inView: false });
    const { result } = renderHook(() => useSectionInView("/#about", 0.5));

    expect(useInViewMock).toHaveBeenCalledWith({ threshold: 0.5 });
    expect(result.current.ref).toBe(ref);
  });

  it("defaults the threshold to 0.75", () => {
    useInViewMock.mockReturnValue({ ref, inView: false });
    renderHook(() => useSectionInView("/#about"));

    expect(useInViewMock).toHaveBeenCalledWith({ threshold: 0.75 });
  });

  it("sets the active section when in view and the last click was over 1s ago", () => {
    useInViewMock.mockReturnValue({ ref, inView: true });
    renderHook(() => useSectionInView("/#about"));

    expect(setActiveSection).toHaveBeenCalledWith("/#about");
  });

  it("does nothing when not in view", () => {
    useInViewMock.mockReturnValue({ ref, inView: false });
    renderHook(() => useSectionInView("/#about"));

    expect(setActiveSection).not.toHaveBeenCalled();
  });

  it("does nothing when the last click was 1s ago or less", () => {
    timeOfLastClick = Date.now() - 1000;
    useInViewMock.mockReturnValue({ ref, inView: true });
    renderHook(() => useSectionInView("/#about"));

    expect(setActiveSection).not.toHaveBeenCalled();
  });
});
