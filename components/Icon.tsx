const PATHS = {
  standings: "M4 5h16M4 12h16M4 19h16M8 5v14",
  round: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  matchday: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8l4 3-1.5 5h-5L8 11zM12 8V3M16 11l4.5-1.5M14.5 16l3 4M9.5 16l-3 4M8 11 3.5 9.5",
  stats: "M5 20v-7M12 20V4M19 20v-11",
  news: "M4 5h13v14H4zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 13h7M7 16h4",
  live: "M12 12h.01M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z",
  design: "M12 3 3 8l9 5 9-5zM3 13l9 5 9-5",
  rail: "M4 4h16v16H4zM15 4v16M8 9l3 3-3 3",
};

/** Line icons for the Studio design; `.ico` is hidden in the classic one. */
export default function Icon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
