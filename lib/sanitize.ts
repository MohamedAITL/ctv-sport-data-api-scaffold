import DOMPurify from "dompurify";

let hooked = false;

/**
 * Publisher HTML is untrusted. The feeds already carry <script> embeds and
 * inline SVG; one `onerror=` in them would run inside this app. Only plain
 * article markup survives — no scripts, frames, forms, SVG or inline styles —
 * and links open in a new tab instead of taking the kiosk off the app.
 *
 * Browser only: it needs a DOM, and the article is fetched client-side.
 */
export function sanitizeArticle(html: string): string {
  if (!hooked) {
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      if (node.nodeName === "A") {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    });
    hooked = true;
  }
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "form", "input", "button", "textarea", "select"],
    FORBID_ATTR: ["style"],
  });
}
