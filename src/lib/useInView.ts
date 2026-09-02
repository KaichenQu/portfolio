import { useActiveSectionContext } from "../containers/active-section";
import { useCallback, useEffect, useState } from "react";

export function useSectionInView(sectionName: string, threshold = 0.75) {
  const [node, setNode] = useState<Element | null>(null);
  const [inView, setInView] = useState(false);
  const ref = useCallback((el: Element | null) => setNode(el), []);
  const { setActiveSection, timeOfLastClick } = useActiveSectionContext();

  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, threshold]);

  useEffect(() => {
    if (inView && Date.now() - timeOfLastClick > 1000) {
      setActiveSection(sectionName);
    }
  }, [inView, setActiveSection, timeOfLastClick, sectionName]);

  return {
    ref,
  };
}
