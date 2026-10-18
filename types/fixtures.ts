export interface RawFixture {
  id?: string;
  matchDate?: string;
  matchTime?: string;
  kickoffUtc?: string;
  matchStatus?: string;
  matchLive?: string;
  matchMinute?: string;
  matchElapsed?: string | null;
  matchPeriod?: string;
  leagueId?: string;
  leagueName?: string;
  leagueLogo?: string | null;
  homeTeamId?: string;
  homeTeamName?: string;
  homeTeamScore?: string | null;
  homeTeamFtScore?: string | null;
  awayTeamId?: string;
  awayTeamName?: string;
  awayTeamScore?: string | null;
  awayTeamFtScore?: string | null;
  homeTeamPenaltyScore?: string | null;
  awayTeamPenaltyScore?: string | null;
  teamHomeBadge?: string | null;
  teamAwayBadge?: string | null;
  matchRound?: string | null;
  homeTeam?: { id?: string; name?: string; badge?: string | null } | null;
  awayTeam?: { id?: string; name?: string; badge?: string | null } | null;
  league?: { id?: string; name?: string; logo?: string | null; popularity?: number } | null;
}

export interface RawFixturesResponse {
  success?: boolean;
  data?: RawFixture[];
}

export interface MatchSide {
  id: string;
  name: string; // API (English) name
  nameAr: string; // Arabic override/seed, falls back to name
  badge: string | null;
  score: number | null;
  pen?: number | null; // penalty-shootout score, when there was one
}

export interface Match {
  id: string;
  date: string;
  time: string; // kickoff local time HH:MM
  kickoffUtc: string;
  status: string; // SCHEDULED / FINISHED / LIVE / ...
  statusLabel: string; // score if finished, minute if live, else time
  isFinished: boolean;
  isLive: boolean;
  leagueId: string;
  leagueName: string;
  leagueLogo: string | null;
  leaguePopularity: number;
  round: string | null;
  fame: number;
  home: MatchSide;
  away: MatchSide;
}
