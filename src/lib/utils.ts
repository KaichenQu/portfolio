import { clsx, ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** On any /blog path only the Blog link is active; elsewhere the scroll-tracked section decides. */
export function isActiveLink(hash: string, activeSection: string, pathname: string | null) {
  if (pathname === "/blog" || pathname?.startsWith("/blog/")) return hash === "/blog";
  return hash === activeSection;
}
