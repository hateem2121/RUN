import type { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  createMediaQueryKey,
  invalidateMediaQueries,
  MediaQueryKeys,
} from "../../../../client/app/lib/media-query-keys";

describe("media-query-keys", () => {
  describe("MediaQueryKeys", () => {
    it("should have valid base keys", () => {
      expect(MediaQueryKeys.all).toEqual(["/api/media"]);
      expect(MediaQueryKeys.paginated).toEqual(["/api/media", "paginated"]);
      expect(MediaQueryKeys.single).toEqual(["/api/media", "single"]);
      expect(MediaQueryKeys.list).toEqual(["/api/media", "list"]);
      expect(MediaQueryKeys.recent).toEqual(["/api/media", "recent"]);
      expect(MediaQueryKeys.batch).toEqual(["/api/media", "batch"]);
      expect(MediaQueryKeys.variants).toEqual(["/api/media", "variants"]);
      expect(MediaQueryKeys.forPage).toEqual(["/api/media", "page"]);
      expect(MediaQueryKeys.assets).toEqual(["/api/media", "assets"]);
      expect(MediaQueryKeys.legacy.base).toEqual(["/api/media"]);
    });
  });

  describe("createMediaQueryKey", () => {
    it("paginated should handle params", () => {
      expect(createMediaQueryKey.paginated()).toEqual([...MediaQueryKeys.paginated, {}]);
      expect(createMediaQueryKey.paginated({ page: 1 })).toEqual([
        ...MediaQueryKeys.paginated,
        { page: 1 },
      ]);
    });

    it("single should handle ids", () => {
      expect(createMediaQueryKey.single(1)).toEqual([...MediaQueryKeys.single, "1"]);
      expect(createMediaQueryKey.single("123")).toEqual([...MediaQueryKeys.single, "123"]);
    });

    it("list should handle params", () => {
      expect(createMediaQueryKey.list()).toEqual([...MediaQueryKeys.list, {}]);
      expect(createMediaQueryKey.list({ limit: 10 })).toEqual([
        ...MediaQueryKeys.list,
        { limit: 10 },
      ]);
    });

    it("recent should handle limit", () => {
      expect(createMediaQueryKey.recent()).toEqual([...MediaQueryKeys.recent, "50"]);
      expect(createMediaQueryKey.recent(10)).toEqual([...MediaQueryKeys.recent, "10"]);
    });

    it("batch should sort and join ids", () => {
      expect(createMediaQueryKey.batch([2, 1, 3])).toEqual([...MediaQueryKeys.batch, "1,2,3"]);
      expect(createMediaQueryKey.batch(["b", "a"])).toEqual([...MediaQueryKeys.batch, "a,b"]);
    });

    it("variants should handle id and options", () => {
      expect(createMediaQueryKey.variants(1)).toEqual([...MediaQueryKeys.variants, "1", {}]);
      expect(createMediaQueryKey.variants(1, { opt: true })).toEqual([
        ...MediaQueryKeys.variants,
        "1",
        { opt: true },
      ]);
    });

    it("forPage should handle page name and ids", () => {
      expect(createMediaQueryKey.forPage("home")).toEqual([
        ...MediaQueryKeys.forPage,
        "home",
        "all",
      ]);
      expect(createMediaQueryKey.forPage("home", [2, 1])).toEqual([
        ...MediaQueryKeys.forPage,
        "home",
        "1,2",
      ]);
    });
  });

  describe("invalidateMediaQueries", () => {
    it("should invalidate correctly", () => {
      const mockClient = {
        invalidateQueries: vi.fn(),
      } as unknown as QueryClient;

      invalidateMediaQueries(mockClient);

      expect(mockClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: MediaQueryKeys.all,
        refetchType: "all",
      });
    });
  });
});
