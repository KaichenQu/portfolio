export function syncTopicFilter(root: HTMLElement | null, search: string) {
  if (!root) return;
  const tabs = [...root.querySelectorAll<HTMLAnchorElement>("[data-topic-tab]")];
  const slug = new URLSearchParams(search).get("topic");
  const current = tabs.find(tab => tab.dataset.topicSlug === slug) ?? tabs[0];
  if (!current) return;

  root.dataset.topic = current.dataset.topicTab;
  for (const tab of tabs) {
    if (tab === current) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  }

  const strip = current.closest("ul")!;
  const tab = current.getBoundingClientRect();
  const viewport = strip.getBoundingClientRect();
  if (tab.left < viewport.left) strip.scrollLeft += tab.left - viewport.left;
  else if (tab.right > viewport.right) strip.scrollLeft += tab.right - viewport.right;
}

// The index HTML is static. Set the selection before the parser reaches the
// case rows so a direct link paints with the same rows as the hydrated page.
export const INITIAL_TOPIC_SCRIPT = `(${syncTopicFilter})(document.currentScript.closest("[data-blog-index]"), location.search)`;
