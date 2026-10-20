import type { RawFixturesResponse, Match, MatchSide } from "@/types/fixtures";
import { famousClub, BASE_WEIGHT } from "@/config/famousClubs";
import { BOTOLA_LEAGUE_ID, MAX_MATCHES } from "@/config/featuredLeagues";

function toInt(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

function side(
  id: string,
  name: string,
  badge: string | null,
  score: string | null | undefined,
  nameMap: Record<string, string>,
  pen?: string | null
): MatchSide {
  const fc = famousClub(name);
  return { id, name, nameAr: (id && nameMap[id]) || fc?.ar || name, badge, score: toInt(score), pen: toInt(pen) };
}

const weight = (name: string): number => famousClub(name)?.w ?? BASE_WEIGHT;

export function normalizeFixtures(
  res: RawFixturesResponse | null | undefined,
  leaguePopularity: number,
  nameMap: Record<string, string> = {}
): Match[] {
  return (res?.data || []).map((f) => {
    const homeName = f.homeTeamName || f.homeTeam?.name || "";
    const awayName = f.awayTeamName || f.awayTeam?.name || "";
    const status = f.matchStatus || "";
    const period = f.matchPeriod || "";
    const isFinished = /FINISHED|FULL_TIME|\bFT\b|ENDED|AET|PEN/i.test(status + " " + period);
    // `&&` binds tighter than `||`, so without the parentheses a finished match
    // that still carries matchLive="1" was flagged live — and the poster then
    // drew the live-minute line, which for a finished match is the score again,
    // reversed, printing it twice.
    const isLive = (f.matchLive === "1" || /LIVE|HALF|1ST|2ND|PLAY|EXTRA/i.test(period)) && !isFinished;
    const home = side(f.homeTeamId || f.homeTeam?.id || "", homeName, f.teamHomeBadge ?? f.homeTeam?.badge ?? null, f.homeTeamScore ?? f.homeTeamFtScore, nameMap, f.homeTeamPenaltyScore);
    const away = side(f.awayTeamId || f.awayTeam?.id || "", awayName, f.teamAwayBadge ?? f.awayTeam?.badge ?? null, f.awayTeamScore ?? f.awayTeamFtScore, nameMap, f.awayTeamPenaltyScore);
    const statusLabel =
      isFinished && home.score !== null && away.score !== null
        ? `${home.score} - ${away.score}`
        : isLive
        ? (f.matchMinute || "LIVE")
        : f.matchTime || "";
    return {
      id: f.id || "",
      date: f.matchDate || "",
      time: f.matchTime || "",
      kickoffUtc: f.kickoffUtc || "",
      status,
      statusLabel,
      isFinished,
      isLive,
      leagueId: f.leagueId || f.league?.id || "",
      leagueName: f.leagueName || f.league?.name || "",
      leagueLogo: f.leagueLogo ?? f.league?.logo ?? null,
      leaguePopularity,
      round: f.matchRound ?? null,
      fame: weight(homeName) + weight(awayName),
      home,
      away,
    };
  });
}

// All Botola matches first (by kickoff), then the most famous matches from the
// other competitions (fame, then league popularity, then kickoff), capped.
export function selectMatchday(all: Match[], max = MAX_MATCHES): Match[] {
  const byKick = (a: Match, b: Match) => a.kickoffUtc.localeCompare(b.kickoffUtc);
  const botola = all.filter((m) => m.leagueId === BOTOLA_LEAGUE_ID).sort(byKick);
  const others = all
    .filter((m) => m.leagueId !== BOTOLA_LEAGUE_ID)
    .sort((a, b) => b.fame - a.fame || b.leaguePopularity - a.leaguePopularity || byKick(a, b));
  const slots = Math.max(0, max - botola.length);
  return [...botola, ...others.slice(0, slots)].slice(0, max);
}
