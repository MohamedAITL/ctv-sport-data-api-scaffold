/** A football, drawn rather than an emoji, so it spins evenly in any size. */
export function Ball({ size = 40 }: { size?: number }) {
  return (
    <svg className="ball" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#fff" stroke="#1a1420" strokeWidth="2" />
      <path fill="#1a1420" d="m24 14 9 6.5-3.4 10.6H18.4L15 20.5zM24 2.2l6.4 4.6L24 11.5l-6.4-4.7zM45.3 18.6l-.9 8-6.9-3.6 2-7.6zM2.7 18.6l5.8-3.2 2 7.6-6.9 3.6zM36.800 41.700l-7.900 3.300-.8-7.700 7.500-2.600zM11.200 41.700l1.200-7 7.500 2.600-.8 7.700z" />
      <path fill="none" stroke="#1a1420" strokeWidth="1.5" d="M24 11.500V14M33 20.500l4.500 2.500M29.600 31.100l5 3.600M18.400 31.100l-5 3.600M15 20.500 10.500 23" />
    </svg>
  );
}

/** Data on its way: the ball and what is being fetched. */
export default function Loader({ label, size }: { label: string; size?: number }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <Ball size={size} />
      <span>{label}</span>
    </div>
  );
}

const lines = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Match rows, so the rail keeps its shape while the day loads. */
export function RailSkeleton() {
  return (
    <div className="kl-list" aria-hidden="true">
      {lines(6).map((i) => (
        <div key={i} className="kl-row skel-row">
          <span className="skel line" style={{ width: "30%" }} />
          <span className="skel line" style={{ width: "78%" }} />
          <span className="skel line" style={{ width: "64%" }} />
        </div>
      ))}
    </div>
  );
}

/** A stat-shaped block under the header while a match opens. */
export function PaneSkeleton() {
  return (
    <div className="skel-pane" aria-hidden="true">
      {lines(7).map((i) => <span key={i} className="skel line" style={{ width: `${96 - (i % 3) * 14}%` }} />)}
    </div>
  );
}
