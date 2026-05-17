import type { BlockDef } from "@/blocks/registry";
import type { AppNode, Group, LabeledEdge, WorkspacePage } from "@/store/flow-store";

export type FlowSnapshotV1 = {
  version: 1;
  nodes: AppNode[];
  edges: LabeledEdge[];
  customBlocks: BlockDef[];
  groups?: Group[];
  turbo?: boolean;
  animateEdges?: boolean;
  animationSpeed?: number;
  turboColors?: [string, string];
};

export type FlowSnapshotV2 = Omit<
  FlowSnapshotV1,
  "version" | "nodes" | "edges" | "groups"
> & {
  version: 2;
  currentPageId: string;
  pages: WorkspacePage[];
};

export type FlowSnapshot = FlowSnapshotV1 | FlowSnapshotV2;

function hasArray(value: unknown, key: string) {
  return typeof value === "object" && value !== null && Array.isArray((value as Record<string, unknown>)[key]);
}

export function normalizeSnapshot(input: unknown): FlowSnapshotV2 {
  if (typeof input !== "object" || input === null) {
    throw new Error("Invalid snapshot shape");
  }
  const data = input as Record<string, unknown>;
  if (data.version === 1) {
    if (!hasArray(data, "nodes") || !hasArray(data, "edges")) {
      throw new Error("Invalid snapshot shape");
    }
    return {
      ...(data as FlowSnapshotV1),
      version: 2,
      currentPageId: "page-main",
      pages: [
        {
          id: "page-main",
          name: "Main",
          nodes: data.nodes as AppNode[],
          edges: data.edges as LabeledEdge[],
          groups: Array.isArray(data.groups) ? (data.groups as Group[]) : [],
        },
      ],
    };
  }
  if (data.version === 2) {
    if (!Array.isArray(data.pages)) throw new Error("Invalid snapshot shape");
    if (data.pages.length === 0) throw new Error("Snapshot must contain at least one page");
    const pages = data.pages as WorkspacePage[];
    const currentPageId =
      typeof data.currentPageId === "string" &&
      pages.some((page) => page.id === data.currentPageId)
        ? data.currentPageId
        : pages[0].id;
    return {
      ...(data as FlowSnapshotV2),
      version: 2,
      currentPageId,
      pages,
      customBlocks: Array.isArray(data.customBlocks)
        ? (data.customBlocks as BlockDef[])
        : [],
    };
  }
  throw new Error("Unsupported file version");
}

export function downloadSnapshot(snapshot: FlowSnapshot, filename?: string) {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const base = (filename ?? `netviz-${Date.now()}`).trim() || "netviz";
  a.download = base.endsWith(".json") ? base : `${base}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function readSnapshotFromFile(file: File): Promise<FlowSnapshotV2> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(normalizeSnapshot(JSON.parse(String(reader.result))));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
