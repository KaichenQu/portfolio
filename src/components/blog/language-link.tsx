import NextLink from "next/link";
import { blogPath, type BlogLocale } from "@/lib/blog-locale";

export function languageAlternates(suffix: string) {
  return { en: blogPath("en", suffix), "zh-Hans": blogPath("zh-Hans", suffix) };
}

export function LanguageLink({
  locale,
  suffix = "",
}: {
  locale: BlogLocale;
  suffix?: string;
}) {
  const target = locale === "en" ? "zh-Hans" : "en";
  return (
    <NextLink
      href={blogPath(target, suffix)}
      hrefLang={target}
      lang={target}
      className="inline-flex w-fit py-1 font-mono text-[12px] text-sky-700 underline-offset-4 hover:underline dark:text-sky-300"
    >
      {target === "en" ? "English" : "简体中文"}
    </NextLink>
  );
}
