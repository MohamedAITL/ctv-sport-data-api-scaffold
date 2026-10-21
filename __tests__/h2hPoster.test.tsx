import { render } from "@testing-library/react";
import { createRef } from "react";
import H2HPoster from "@/components/live/H2HPoster";
import { DEFAULT_H2H_LAYOUT } from "@/config/h2hLayout";
import type { LiveMatch, PastMatch } from "@/types/live";

const team = (id: number, name: string) => ({ id, name, score: null, logo: null });
const match = {
  id: 1, matchupId: "1-2-3", competitionId: 3, competition: "دوري أبطال اوروبا",
  competitionLogo: null, startTime: "2026-10-21T19:00:00Z", statusText: "لم تبدأ",
  clock: "", isLive: false, isFinished: false,
  home: team(1, "بايرن ميونخ"), away: team(2, "أرسنال"),
} as LiveMatch;

// Bayern — the match's home side — lost this meeting 1-3 away.
const meeting: PastMatch = {
  id: 9, date: "2025-11-26T20:00:00Z", competitionId: 3, competition: "دوري أبطال اوروبا",
  home: { name: "أرسنال", score: 3, logo: null },
  away: { name: "بايرن ميونخ", score: 1, logo: null },
};
const record = { played: 1, homeWins: 0, draws: 0, awayWins: 1, homeGoals: 1, awayGoals: 3 };

// The row draws our side on the right and the opponent on the left, but the
// score itself is laid out left-to-right: printed in the other order, every
// result on the poster reads as the opponent's.
it("prints the score in the order the crests are drawn", () => {
  const { container } = render(
    <H2HPoster ref={createRef<HTMLDivElement>()} match={match} meetings={[meeting]} record={record} layout={DEFAULT_H2H_LAYOUT} templateSrc={null} />
  );
  const score = Array.from(container.querySelectorAll("div"))
    .map((d) => (d.textContent ?? "").trim())
    .find((t) => /^\d+ - \d+$/.test(t));
  expect(score).toBe("3 - 1"); // left: Arsenal 3, right: Bayern 1
});
