/** @jest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";
import LivePage from "@/pages/live";

const game = (id: number, over: object = {}) => ({
  id, matchupId: `1-2-${id}`, competitionId: 11, competition: "الدوري الإسباني", competitionLogo: null, startTime: "2026-10-30T20:00:00+01:00",
  statusText: "انتهت", clock: "", isLive: false, isFinished: true, home: { id: 1, name: "أ", score: 1, logo: null }, away: { id: 2, name: "ب", score: 0, logo: null }, ...over,
});

const answer = (json: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(json) });

function serve(detail: unknown) {
  const calls: string[] = [];
  global.fetch = jest.fn((url: string) => {
    calls.push(url);
    return url.startsWith("/api/live/") ? answer({ detail }) : answer({ matches: [game(7), game(8)], fetchedAt: "2026-10-30T20:00:00Z" });
  }) as unknown as typeof fetch;
  return calls;
}

describe("opening the live section", () => {
  it("loads the first match straight away, without a click or a poll", async () => {
    const calls = serve(null);
    render(<LivePage />);
    await waitFor(() => expect(calls.some((u) => u.startsWith("/api/live/7?"))).toBe(true));
  });

  it("says so instead of spinning forever when a match has no details", async () => {
    serve(null);
    render(<LivePage />);
    await screen.findByText("تعذر تحميل المباراة، ستتم إعادة المحاولة.");
    expect(document.querySelector(".kiosk-wait")).toBeNull();
  });
});
