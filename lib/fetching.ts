// How many reads are in flight, on <html>, for the Studio design's moving strip.
let count = 0;
const mark = () => {
  if (typeof document === "undefined") return;
  if (count > 0) document.documentElement.dataset.fetching = "1";
  else delete document.documentElement.dataset.fetching;
};
export const fetchStart = () => { count++; mark(); };
export const fetchEnd = () => { count = Math.max(0, count - 1); mark(); };
