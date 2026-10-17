import * as htmlToImage from "html-to-image";

const W = 1080;
const H = 1350;

// Wait until fonts and every <img> in the node are ready, so Arabic glyphs and
// logos are embedded in the capture rather than missing/fallback.
async function waitReady(node: HTMLElement): Promise<void> {
  try {
    if (typeof document !== "undefined" && (document as Document).fonts) {
      await (document as Document).fonts.ready;
    }
  } catch {
    /* ignore */
  }
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          })
    )
  );
}

async function render(node: HTMLElement, format: "png" | "jpeg"): Promise<string> {
  await waitReady(node);
  const opts = {
    width: W,
    height: H,
    pixelRatio: 1, // exact 1080x1350, no scaling
    cacheBust: true,
    backgroundColor: "#2b1a45",
  };
  // html-to-image can miss fonts/images on the first pass; a warm-up render
  // then the real one is the reliable fix.
  if (format === "jpeg") {
    await htmlToImage.toJpeg(node, { ...opts, quality: 0.95 });
    return htmlToImage.toJpeg(node, { ...opts, quality: 0.95 });
  }
  await htmlToImage.toPng(node, opts);
  return htmlToImage.toPng(node, opts);
}

export async function downloadPoster(
  node: HTMLElement,
  format: "png" | "jpeg",
  filename: string
): Promise<void> {
  const dataUrl = await render(node, format);
  const a = document.createElement("a");
  a.download = filename;
  a.href = dataUrl;
  a.click();
}

export function posterFilename(ext: "png" | "jpeg"): string {
  const d = new Date().toISOString().slice(0, 10);
  return `botola-pro-standings-${d}.${ext === "jpeg" ? "jpg" : "png"}`;
}
