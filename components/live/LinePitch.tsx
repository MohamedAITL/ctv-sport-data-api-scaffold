import type { LineupPlayer, LiveDetail, TeamLineup } from "@/types/live";

// `line` is depth from a team's own goal (0-100) and `side` is lateral (0-100),
// so the two teams face each other across the halfway line.
// Home sits on the right, matching the right-to-left header and match list, so
// the same team is on the same side everywhere on the screen.
const spot = (p: LineupPlayer, home: boolean) => {
  const depth = ((p.line ?? 50) / 100) * 46; // keep clear of the touchline
  return {
    left: home ? `${98 - depth}%` : `${2 + depth}%`,
    top: `${Math.min(94, Math.max(6, p.side ?? 50))}%`,
  };
};

function Shirt({ p, home }: { p: LineupPlayer; home: boolean }) {
  return (
    <div className={home ? "kp-man home" : "kp-man away"} style={spot(p, home)}>
      <span className="kp-num">{p.number ?? "?"}</span>
      <span className="kp-name">{p.shortName || p.name}</span>
    </div>
  );
}

function Bench({ lineup, title }: { lineup: TeamLineup; title: string }) {
  return (
    <div className="kp-bench">
      <h4>{title}{lineup.formation ? ` · ${lineup.formation}` : ""}</h4>
      {lineup.bench.length > 0 && (
        <ul>
          {lineup.bench.map((p) => (
            <li key={p.id}><b>{p.number ?? "-"}</b> {p.shortName || p.name}</li>
          ))}
        </ul>
      )}
      {lineup.missing.length > 0 && (
        <>
          <h5>غيابات</h5>
          <ul className="kp-out">
            {lineup.missing.map((p) => <li key={p.id}>{p.shortName || p.name}</li>)}
          </ul>
        </>
      )}
      {lineup.coach && <p className="kp-coach">المدرب: {lineup.coach.name}</p>}
    </div>
  );
}

// Falls back twice: to a plain XI list when the source has no pitch coordinates,
// and to a message when the competition publishes no lineup at all (common
// outside the top divisions).
export default function LinePitch({ d }: { d: LiveDetail }) {
  const { homeLineup: h, awayLineup: a } = d;
  if (!h && !a) {
    return (
      <div className="kp-none" dir="rtl">
        <p>التشكيلة غير متوفرة لهذه المباراة</p>
        <span>لا ينشر المصدر تشكيلات هذه المسابقة</span>
      </div>
    );
  }
  const positioned = Boolean(h?.hasFieldPositions && a?.hasFieldPositions);

  return (
    <div className="kp" dir="rtl">
      {positioned ? (
        <div className="kp-pitch">
          <div className="kp-mid" />
          <div className="kp-circle" />
          {h?.starting.map((p) => <Shirt key={p.id} p={p} home />)}
          {a?.starting.map((p) => <Shirt key={p.id} p={p} home={false} />)}
        </div>
      ) : (
        <div className="kp-xi">
          {[h, a].map((lu, i) =>
            lu ? (
              <div key={i}>
                <h4>{i === 0 ? d.match.home.name : d.match.away.name}{lu.formation ? ` · ${lu.formation}` : ""}</h4>
                <ul>
                  {lu.starting.map((p) => (
                    <li key={p.id}><b>{p.number ?? "-"}</b> {p.name} <em>{p.position}</em></li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>
      )}
      <div className="kp-benches">
        {h && <Bench lineup={h} title={d.match.home.name} />}
        {a && <Bench lineup={a} title={d.match.away.name} />}
      </div>
    </div>
  );
}
