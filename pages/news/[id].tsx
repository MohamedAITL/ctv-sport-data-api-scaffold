import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState, useRef } from "react";
import Nav from "@/components/Nav";
import { sourceName, type NewsItem } from "@/types/news";
import { sanitizeArticle } from "@/lib/sanitize";
import { useLang } from "@/lib/prefs";

// Publishers send the body as one blob: hesport uses blank lines, elbotola runs
// paragraphs together with no space after the full stop. Both are handled here
// so the article never renders as a wall of text.
const splitParagraphs = (text: string): string[] =>
  text
    .split(/\n{2,}|(?<=[.\u061F!])(?=[\u0600-\u06FF])/)
    .map((p) => p.trim())
    .filter(Boolean);

const arDate = (iso: string, locale: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString(locale, { dateStyle: "long", timeStyle: "short" });
};

export default function NewsDetail() {
  const { t, lang, locale } = useLang();
  // Read through a ref: the language settles just after mount, and a fetch
  // must not run twice for it.
  const tRef = useRef(t);
  tRef.current = t;
  const { query, isReady } = useRouter();
  const id = typeof query.id === "string" ? query.id : "";
  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [titles, setTitles] = useState<string[]>([]);
  const [titlesLoading, setTitlesLoading] = useState(false);
  const [titlesError, setTitlesError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [engine, setEngine] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !id) return;
    setLoading(true);
    fetch(`/api/news/${id}`)
      .then((r) => r.json())
      .then((j) => (j.item ? setItem(j.item) : setError(j.error || tRef.current("تعذر تحميل الخبر", "Could not load the article"))))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [isReady, id]);

  const makeTitles = async () => {
    setTitlesLoading(true);
    setTitlesError(null);
    try {
      const r = await fetch("/api/titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await r.json();
      if (j.titles?.length) { setTitles(j.titles); setEngine(j.engine ?? null); }
      else setTitlesError(j.error || tRef.current("تعذر توليد العناوين", "Could not generate titles"));
    } catch (e) {
      setTitlesError(String(e));
    } finally {
      setTitlesLoading(false);
    }
  };

  const copy = async (t: string, i: number) => {
    try {
      await navigator.clipboard.writeText(t);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    } catch { /* clipboard blocked */ }
  };

  // Only ever shown for allowlisted publishers, and always beside attribution.
  const body = item?.body?.trim() || "";
  const safeHtml = useMemo(() => (item?.bodyIsHtml && body ? sanitizeArticle(body) : ""), [item, body]);
  const summary = item?.summary?.trim() || "";

  return (
    <>
      <Head><title>{item?.title ? `${item.title} — Chouf TV` : t("خبر — Chouf TV", "Article — Chouf TV")}</title></Head>
      <main className="app">
        <header className="topbar">
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brandlogo" src="/chouftv-logo.png" alt="Chouf TV" />
          </div>
          <Nav />
        </header>

        <div className="pagehead">
          <Link href="/news" className="navlink">{t("‹ كل الأخبار")}</Link>
        </div>

        {loading && <p className="muted">{t("جاري التحميل…")}</p>}
        {error && <p className="err">{error}</p>}

        {item && (
          <article className="article" dir="rtl">
            {item.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="articlehero" src={item.image} alt="" />
            )}
            <h1 className="articletitle">{item.title}</h1>

            <div className="articlemeta">
              {item.section && <span>{item.section}</span>}
              <span>{arDate(item.publishedAt, locale)}</span>
            </div>

            {body ? (
              item.bodyIsHtml ? (
                // Publisher HTML, sanitised: see lib/sanitize.ts.
                <div className="articlebody" dangerouslySetInnerHTML={{ __html: safeHtml }} />
              ) : (
                <div className="articlebody">
                  {splitParagraphs(body).map((p, i) => <p key={i}>{p}</p>)}
                </div>
              )
            ) : (
              <div className="articlebody">
                {summary && <p>{summary}</p>}
                <p className="muted">
                  {t("هذا المصدر لا ينشر نص المقال كاملا. اقرأ الخبر كاملا من المصدر الأصلي.", "This source does not publish the full text. Read the whole article at the original.")}
                </p>
              </div>
            )}

            {item.tags && item.tags.length > 0 && (
              <div className="articletags">
                {item.tags.map((t, i) => (
                  <span key={i} className="tagchip">
                    {t.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.image} alt="" />
                    )}
                    {t.name}
                  </span>
                ))}
              </div>
            )}

            <div className="titlebox">
              <div className="titlebox-head">
                <h3>{t("عناوين للنشر على مواقع التواصل")}</h3>
                <button className="btn" disabled={titlesLoading} onClick={makeTitles}>
                  {titlesLoading ? t("جاري التوليد…", "Generating…") : titles.length ? t("توليد عناوين أخرى", "Generate more titles") : t("توليد عناوين", "Generate titles")}
                </button>
              </div>
              {titlesError && <p className="err">{titlesError}</p>}
              {engine === "rules" && titles.length > 0 && (
                <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
                  {t("مقتطعة من نص المقال. لصياغة عناوين جديدة، أضف ANTHROPIC_API_KEY.", "Taken from the article text. To write new titles, add ANTHROPIC_API_KEY.")}
                </p>
              )}
              {titles.length > 0 && (
                <ul className="titlelist">
                  {titles.map((title, i) => (
                    <li key={i}>
                      <span>{title}</span>
                      <button className="copybtn" onClick={() => copy(title, i)}>
                        {copied === i ? t("تم النسخ", "Copied") : t("نسخ", "Copy")}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="articlesource">
              <div className="muted">
                {sourceName(item.source, lang)}
                {item.author ? ` — ${item.author}` : ""}
              </div>
              <a className="btn" href={item.url} target="_blank" rel="noopener noreferrer nofollow">
                {t("اقرأ المقال الأصلي ↗", "Read the original article ↗")}
              </a>
            </div>
          </article>
        )}
      </main>
    </>
  );
}
