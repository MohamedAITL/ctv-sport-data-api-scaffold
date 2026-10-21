import { renderHook, waitFor } from "@testing-library/react";
import { useCachedData } from "@/lib/useCachedData";
import { readCache, writeCache } from "../lib/db";

// relative: next/jest rewrites @/ in imports, not in jest.mock() paths
jest.mock("../lib/db", () => ({
  readCache: jest.fn(),
  writeCache: jest.fn(),
}));

const cached = { rows: ["الوداد", "الرجاء"] };

beforeEach(() => {
  (readCache as jest.Mock).mockResolvedValue({ data: cached, at: "2026-10-21T10:00:00Z" });
  (writeCache as jest.Mock).mockClear();
});

// The pages used to *return* an empty payload when the server failed. This is
// the contract they now rely on by throwing: one upstream blip must not blank
// the table on screen, nor overwrite the copy a reload would show.
it("keeps the cached data and does not overwrite the cache when a refresh fails", async () => {
  const { result } = renderHook(() =>
    useCachedData("standings:557", () => Promise.reject(new Error("فشل الطلب")))
  );
  await waitFor(() => expect(result.current.error).toBe("فشل الطلب"));
  expect(result.current.data).toEqual(cached);
  expect(writeCache).not.toHaveBeenCalled();
});

it("replaces and caches the data when a refresh succeeds", async () => {
  const fresh = { rows: ["نهضة بركان"] };
  const { result } = renderHook(() => useCachedData("standings:557", () => Promise.resolve(fresh)));
  await waitFor(() => expect(result.current.data).toEqual(fresh));
  expect(writeCache).toHaveBeenCalledWith("standings:557", fresh);
  expect(result.current.error).toBeNull();
});
