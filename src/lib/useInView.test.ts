import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

const setActiveSection = vi.fn();
let timeOfLastClick = 0;
vi.mock("../containers/active-section", () => ({
  useActiveSectionContext: () => ({ setActiveSection, timeOfLastClick }),
}));

import { useSectionInView } from "./useInView";

type IOCallback = (entries: { isIntersecting: boolean }[]) => void;
let observe: ReturnType<typeof vi.fn>;
let disconnect: ReturnType<typeof vi.fn>;
let lastCallback: IOCallback;
let lastOptions: IntersectionObserverInit | undefined;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-01T00:00:10Z"));
  setActiveSection.mockClear();
  timeOfLastClick = 0;
  observe = vi.fn();
  disconnect = vi.fn();
  globalThis.IntersectionObserver = class {
    constructor(cb: IOCallback, options?: IntersectionObserverInit) {
      lastCallback = cb;
      lastOptions = options;
    }
    observe = observe;
    disconnect = disconnect;
  } as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  vi.useRealTimers();
});

function mount(sectionName = "/#about", threshold?: number) {
  const hook = renderHook(() => useSectionInView(sectionName, threshold));
  const el = document.createElement("section");
  act(() => hook.result.current.ref(el));
  return { ...hook, el };
}

describe("useSectionInView", () => {
  it("observes the ref'd element with the given threshold", () => {
    const { el } = mount("/#about", 0.5);

    expect(observe).toHaveBeenCalledWith(el);
    expect(lastOptions).toEqual({ threshold: 0.5 });
  });

  it("defaults the threshold to 0.75", () => {
    mount();

    expect(lastOptions).toEqual({ threshold: 0.75 });
  });

  it("sets the active section when in view and the last click was over 1s ago", () => {
    mount();
    act(() => lastCallback([{ isIntersecting: true }]));

    expect(setActiveSection).toHaveBeenCalledWith("/#about");
  });

  it("does nothing when not in view", () => {
    mount();
    act(() => lastCallback([{ isIntersecting: false }]));

    expect(setActiveSection).not.toHaveBeenCalled();
  });

  it("does nothing when the last click was 1s ago or less", () => {
    timeOfLastClick = Date.now() - 1000;
    mount();
    act(() => lastCallback([{ isIntersecting: true }]));

    expect(setActiveSection).not.toHaveBeenCalled();
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = mount();
    unmount();

    expect(disconnect).toHaveBeenCalled();
  });
});
