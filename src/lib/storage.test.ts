import { describe, expect, it } from "vitest";
import { normalizeSnapshot } from "./storage";

describe("snapshot normalization", () => {
  it("accepts version 1 single-canvas snapshots and migrates them into pages", () => {
    const snapshot = normalizeSnapshot({
      version: 1,
      nodes: [{ id: "n1", type: "text", position: { x: 0, y: 0 }, data: { text: "Hello" } }],
      edges: [],
      customBlocks: [],
      groups: [],
    });

    expect(snapshot.version).toBe(2);
    expect(snapshot.pages).toHaveLength(1);
    expect(snapshot.pages[0]).toMatchObject({
      id: "page-main",
      name: "Main",
      nodes: expect.arrayContaining([expect.objectContaining({ id: "n1" })]),
      edges: [],
      groups: [],
    });
    expect(snapshot.currentPageId).toBe("page-main");
  });

  it("accepts valid version 2 paged snapshots", () => {
    const snapshot = normalizeSnapshot({
      version: 2,
      currentPageId: "p2",
      pages: [
        { id: "p1", name: "Overview", nodes: [], edges: [], groups: [] },
        { id: "p2", name: "Security", nodes: [], edges: [], groups: [] },
      ],
      customBlocks: [],
    });

    expect(snapshot.currentPageId).toBe("p2");
    expect(snapshot.pages.map((p) => p.name)).toEqual(["Overview", "Security"]);
  });

  it("rejects malformed snapshots", () => {
    expect(() => normalizeSnapshot({ version: 2, pages: [], customBlocks: [] })).toThrow(
      "Snapshot must contain at least one page"
    );
    expect(() => normalizeSnapshot({ version: 99 })).toThrow("Unsupported file version");
  });
});
