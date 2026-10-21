import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import { sourceName, type NewsItem } from "@/types/news";
import { sanitizeArticle } from "@/lib/sanitize";

// Publishers send the body as one blob: hesport uses blank lines, elbotola runs
// paragraphs together with no space after the full stop. Both are handled here
// so the article never renders as a wall of text.
const splitParagraphs = (text: string): string[] =>
  text
    .split(/\n{2,}|(?<=[.\u061F!])(?=[\u0600-\u06FF])/)
    .map((p) => p.trim())
    .filter(Boolean);

const arDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("ar-MA", { dateStyle: "long", timeStyle: "short" });
};

export default function NewsDetail() {
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
      .then((j) => (j.item ? setItem(j.item) : setError(j.error || "تعذر تحميل الخبر")))
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
      else setTitlesError(j.error || "تعذر توليد العناوين");
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
      <Head><title>{item?.title ? `${item.title} — Chouf TV` : "خبر — Chouf TV"}</title></Head>
      <main className="app">
        <header className="topbar">
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brandlogo" src="/chouftv-logo.png" alt="Chouf TV" />
          </div>
          <Nav />
        </header>

        <div className="pagehead">
          <Link href="/news" className="navlink">‹ كل الأخبار</Link>
        </div>

        {loading && <p className="muted">جاري التحميل…</p>}
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
              <span>{arDate(item.publishedAt)}</span>
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
                  هذا المصدر لا ينشر نص المقال كاملا. اقرأ الخبر كاملا من المصدر الأصلي.
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
                <h3>عناوين للنشر على مواقع التواصل</h3>
                <button className="btn" disabled={titlesLoading} onClick={makeTitles}>
                  {titlesLoading ? "جاري التوليد…" : titles.length ? "توليد عناوين أخرى" : "توليد عناوين"}
                </button>
              </div>
              {titlesError && <p className="err">{titlesError}</p>}
              {engine === "rules" && titles.length > 0 && (
                <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
                  مقتطعة من نص المقال. لصياغة عناوين جديدة، أضف ANTHROPIC_API_KEY.
                </p>
              )}
              {titles.length > 0 && (
                <ul className="titlelist">
                  {titles.map((t, i) => (
                    <li key={i}>
                      <span>{t}</span>
                      <button className="copybtn" onClick={() => copy(t, i)}>
                        {copied === i ? "تم النسخ" : "نسخ"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="articlesource">
              <div className="muted">
                المصدر: {sourceName(item.source)}
                {item.author ? ` — ${item.author}` : ""}
              </div>
              <a className="btn" href={item.url} target="_blank" rel="noopener noreferrer nofollow">
                اقرأ المقال من المصدر ↗
              </a>
            </div>
          </article>
        )}
      </main>
    </>
  );
}
