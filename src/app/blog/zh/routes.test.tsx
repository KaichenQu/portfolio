import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import ActiveSectionContextProvider from "@/containers/active-section";
import NotePage from "@/components/blog/note-page";
import TagPage from "@/components/blog/tag-page";
import type { Note } from "@/lib/devlog";
import EnIndex, { metadata as enIndexMetadata } from "../(en)/page";
import { generateMetadata as enNoteMetadata } from "../(en)/[slug]/page";
import { generateMetadata as enTagMetadata } from "../(en)/tags/[tag]/page";
import Index, { metadata } from "./page";
import Layout from "./layout";
import { generateMetadata as noteMetadata, generateStaticParams as noteParams } from "./[slug]/page";
import { generateMetadata as tagMetadata, generateStaticParams as tagParams } from "./tags/[tag]/page";

const { getNotes } = vi.hoisted(() => ({ getNotes: vi.fn() }));

const note = (slug: string, title: string, section: Note["section"], tags: string[]): Note => ({
  slug, title, section, tags,
  description: "故障的成因。",
  summary: "排查记录。",
  links: [],
  body: "",
  readingMinutes: 2,
  status: "solved",
});
const twin = note("pump", "Pump failure", "Debug cases", ["common", "en-only"]);
const zhNotes = [
  note("pump", "水泵故障", "Debug cases", ["common", "zh-only"]),
  note("valve", "阀门", "Glossary", ["common"]),
];
const enNotes = [
  twin,
  note("valve", "Valve", "Glossary", []),
  note("gauge", "Gauge", "Techniques", []),
];

getNotes.mockImplementation(({ locale = "en" } = {}) =>
  locale === "zh-Hans" ? zhNotes : enNotes,
);
vi.mock("@/lib/devlog", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/devlog")>()),
  getNotes,
  getNote: (slug: string, source: { locale: string }) =>
    getNotes(source).find((n: Note) => n.slug === slug),
  getTags: (source: { locale: string }) =>
    getNotes(source).flatMap((n: Note) => n.tags.map((tag) => ({ tag }))),
  getBacklinks: () => zhNotes.slice(1),
  renderNote: () => ({
    html: '<h2 id="check">检查</h2><img src="/blog/diagrams/zh/pump.svg" alt="流程图">',
    toc: [{ depth: 2, id: "check", text: "检查" }],
    hasMermaid: false,
  }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/blog/zh/pump",
  notFound: () => { throw new Error("Not found"); },
}));

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });
const tag = (name: string) => ({ params: Promise.resolve({ tag: name }) });

describe("Chinese blog routes", () => {
  it("marks the shared chrome as Chinese and keeps glossary notes in the explorer", () => {
    render(
      <ActiveSectionContextProvider>
        <Layout><Index /></Layout>
      </ActiveSectionContextProvider>,
    );
    const main = screen.getByRole("main");
    expect(main.closest("[lang]")).toHaveAttribute("lang", "zh-Hans");
    expect(within(main).getByRole("heading", { level: 1, name: "工程笔记" })).toBeInTheDocument();
    expect(within(main).getByRole("link", { name: "English" })).toHaveAttribute("href", "/blog");
    expect(within(main).getByRole("region", { name: "案例" })).toHaveTextContent("水泵故障");
    expect(within(main).queryByRole("link", { name: /阀门/ })).not.toBeInTheDocument();

    const explorer = screen.getByRole("navigation", { name: "工程笔记" });
    expect(within(explorer).getByRole("searchbox", { name: "按标题或标签筛选笔记" })).toBeInTheDocument();
    expect(within(explorer).getByRole("link", { name: "水泵故障" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(within(explorer).getByRole("button", { name: /^术语/ }));
    expect(within(explorer).getByRole("link", { name: "阀门" })).toHaveAttribute("href", "/blog/zh/valve");
  });

  it("offers the English index when the Chinese mirror is empty", () => {
    getNotes.mockReturnValueOnce([]);
    render(<Index />);
    expect(screen.getByText("暂无笔记。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("href", "/blog");
  });

  it("links the English index back and declares alternate index URLs in both editions", () => {
    render(<EnIndex />);
    expect(screen.getByRole("link", { name: "简体中文" })).toHaveAttribute("href", "/blog/zh");
    const languages = { en: "/blog", "zh-Hans": "/blog/zh" };
    expect(enIndexMetadata.alternates).toEqual({ canonical: "/blog", languages });
    expect(metadata.alternates).toEqual({ canonical: "/blog/zh", languages });
    expect(metadata).toMatchObject({ title: "工程笔记", openGraph: { locale: "zh_CN" } });
  });

  it("renders localized note chrome with the existing language twin and tag links", async () => {
    expect(noteParams()).toEqual([{ slug: "pump" }, { slug: "valve" }]);
    render(await NotePage({ ...params("pump"), locale: "zh-Hans" }));

    expect(screen.getByRole("heading", { name: "水泵故障" })).toBeInTheDocument();
    expect(screen.getByText("阅读约 2 分钟")).toBeInTheDocument();
    expect(screen.getByText("已解决")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "流程图" })).toHaveAttribute("src", "/blog/diagrams/zh/pump.svg");
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("href", "/blog/pump");
    expect(screen.getByRole("link", { name: "#common" })).toHaveAttribute("href", "/blog/zh/tags/common");
    expect(within(screen.getByRole("navigation", { name: "目录" })).getByRole("link")).toHaveAttribute("href", "#check");
    expect(within(screen.getByRole("navigation", { name: "反向链接" })).getByRole("link")).toHaveAttribute("href", "/blog/zh/valve");
  });

  it("declares reciprocal note URLs with a shared English share card", async () => {
    const languages = { en: "/blog/pump", "zh-Hans": "/blog/zh/pump" };
    const [en, zh] = await Promise.all([enNoteMetadata(params("pump")), noteMetadata(params("pump"))]);
    expect(en.alternates).toEqual({ canonical: "/blog/pump", languages });
    expect(zh.alternates).toEqual({ canonical: "/blog/zh/pump", languages });
    expect(zh.openGraph).toMatchObject({
      title: "水泵故障 | Kelson Qu",
      description: "故障的成因。",
      locale: "zh_CN",
      images: [{ url: "/blog/pump/opengraph-image", alt: "Pump failure" }],
    });
    expect(zh.openGraph?.images).toEqual(en.openGraph?.images);
    expect(zh.twitter?.images).toEqual(en.twitter?.images);

    render(await NotePage({ ...params("pump"), locale: "en" }));
    expect(screen.getByRole("link", { name: "简体中文" })).toHaveAttribute("href", "/blog/zh/pump");
  });

  it("omits links and metadata for an unpublished language twin", async () => {
    render(await NotePage({ ...params("gauge"), locale: "en" }));
    expect(screen.queryByRole("link", { name: "简体中文" })).toBeNull();
    expect((await enNoteMetadata(params("gauge"))).alternates).toEqual({
      canonical: "/blog/gauge",
    });
  });

  it("provides reciprocal tag pages even when an edition has no matching notes", async () => {
    expect(tagParams()).toEqual([{ tag: "common" }, { tag: "en-only" }, { tag: "zh-only" }]);
    const props = tag("en-only");
    const languages = { en: "/blog/tags/en-only", "zh-Hans": "/blog/zh/tags/en-only" };
    const [en, zh] = await Promise.all([enTagMetadata(props), tagMetadata(props)]);
    expect(en.alternates).toEqual({ canonical: languages.en, languages });
    expect(zh.alternates).toEqual({ canonical: languages["zh-Hans"], languages });
    expect(zh.title).toBe("标签 #en-only");

    render(await TagPage({ ...props, locale: "zh-Hans" }));
    expect(screen.getByText("此标签下暂无中文笔记。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("href", "/blog/tags/en-only");
    await expect(TagPage({ ...tag("unknown"), locale: "zh-Hans" })).rejects.toThrow("Not found");
  });

  it("renders matching notes on the Chinese tag page", async () => {
    render(await TagPage({ ...tag("common"), locale: "zh-Hans" }));
    expect(screen.getByText("2 篇笔记")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /水泵故障/ })).toHaveAttribute("href", "/blog/zh/pump");
  });
});
