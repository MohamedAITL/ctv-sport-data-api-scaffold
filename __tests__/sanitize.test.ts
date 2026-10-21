import { sanitizeArticle } from "@/lib/sanitize";

// What the feeds actually send: 365scores' WordPress posts embed Instagram with
// a <script> and an inline <svg>; kooora ships a JSON <script> placement.
const FEED = `
  <h3 class="wp-block-heading">الشارقة يستهدف بناء منظومة متماسكة</h3>
  <p>أوضح <a href="https://www.365scores.com/ar/football/team/sharjah-sc-8351">الشارقة</a> أن الفريق جاهز.</p>
  <blockquote class="instagram-media"><svg width="50" height="50"><path d="M0 0"/></svg><p>منشور</p></blockquote>
  <script async src="//www.instagram.com/embed.js"></script>
  <script type="application/json">{"type":"brand-promotion"}</script>
  <img src="https://img.example/a.jpg" alt="" onerror="alert(1)">
  <a href="javascript:alert(2)">رابط</a>
  <iframe src="https://evil.example"></iframe>
  <p style="width:2000px">نص</p>
`;

it("strips everything that can run or restyle the app", () => {
  const out = sanitizeArticle(FEED);
  expect(out).not.toMatch(/<script/i);
  expect(out).not.toMatch(/<svg/i);
  expect(out).not.toMatch(/<iframe/i);
  expect(out).not.toMatch(/onerror/i);
  expect(out).not.toMatch(/javascript:/i);
  expect(out).not.toMatch(/style=/i);
});

it("keeps the article itself, with links opening outside the app", () => {
  const box = document.createElement("div");
  box.innerHTML = sanitizeArticle(FEED);
  expect(box.querySelector("h3")?.textContent).toBe("الشارقة يستهدف بناء منظومة متماسكة");
  expect(box.querySelectorAll("p")).toHaveLength(3);
  expect(box.querySelector("img")?.getAttribute("src")).toBe("https://img.example/a.jpg");
  const link = box.querySelector('a[href^="https://www.365scores.com"]');
  expect(link?.getAttribute("target")).toBe("_blank");
  expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
});
