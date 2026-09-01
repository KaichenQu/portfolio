import { describe, it, expect } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import ActiveSectionContextProvider, {
  useActiveSectionContext,
} from "./active-section";

describe("useActiveSectionContext", () => {
  it("throws when used outside of the provider", () => {
    expect(() => renderHook(() => useActiveSectionContext())).toThrow(
      /must be used within an ActiveSectionContextProvider/,
    );
  });

  it("exposes the default active section and click time inside the provider", () => {
    const { result } = renderHook(() => useActiveSectionContext(), {
      wrapper: ActiveSectionContextProvider,
    });

    expect(result.current.activeSection).toBe("/");
    expect(result.current.timeOfLastClick).toBe(0);
  });

  it("updates activeSection and timeOfLastClick through the setters", () => {
    const { result } = renderHook(() => useActiveSectionContext(), {
      wrapper: ActiveSectionContextProvider,
    });

    act(() => {
      result.current.setActiveSection("/#about");
      result.current.setTimeOfLastClick(1234);
    });

    expect(result.current.activeSection).toBe("/#about");
    expect(result.current.timeOfLastClick).toBe(1234);
  });
});

describe("ActiveSectionContextProvider", () => {
  it("renders its children", () => {
    render(
      <ActiveSectionContextProvider>
        <span>child</span>
      </ActiveSectionContextProvider>,
    );

    expect(screen.getByText("child")).toBeInTheDocument();
  });
});
