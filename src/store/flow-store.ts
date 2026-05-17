import { create } from "zustand";
import {
  persist,
  type PersistStorage,
  type StorageValue,
} from "zustand/middleware";
import { temporal } from "zundo";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import {
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  MarkerType,
  type Edge,
  type EdgeMarker,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { CORE_BLOCKS, type Accent, type BlockDef } from "@/blocks/registry";
import type { IconName } from "@/blocks/icons";

export type InfraVariant = "row" | "card";
export type IconPosition = "left" | "right" | "top" | "bottom";
export type TextAlign = "left" | "center" | "right";

export type NodeArchitecture = {
  category?: string;
  environment?: string;
  trustZone?: string;
  dataClassification?: string;
};
type WithGroup = { groupId?: string | null; architecture?: NodeArchitecture };
export type EdgeArchitecture = {
  protocol?: string;
  port?: string;
  dataFlow?: string;
};
export const DEFAULT_NODE_ARCHITECTURE: NodeArchitecture = {
  category: "unspecified",
  environment: "unspecified",
  trustZone: "unspecified",
  dataClassification: "unspecified",
};
export const DEFAULT_EDGE_ARCHITECTURE: EdgeArchitecture = {
  protocol: "",
  port: "",
  dataFlow: "",
};
type WithColors = {
  bgColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  borderColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  turbo?: boolean;
};

export type InfraNodeData = WithGroup &
  WithColors & {
    blockId: string;
    label: string;
    subtitle?: string;
    iconName?: IconName;
    accent?: Accent;
    variant?: InfraVariant;
    iconPosition?: IconPosition;
    textAlign?: TextAlign;
    customIcon?: string;
  };
export type InfraNode = Node<InfraNodeData, "infra">;

export type ShapeKind = "rectangle" | "circle";
export type BorderStyle = "solid" | "dashed" | "dotted";
export type ShapeNodeData = WithGroup &
  WithColors & {
    shape: ShapeKind;
    label?: string;
    accent?: Accent;
    borderStyle?: BorderStyle;
  };
export type ShapeNode = Node<ShapeNodeData, "shape">;

export type TextNodeData = WithGroup &
  WithColors & {
    text: string;
    accent?: Accent;
    fontSize?: number;
  };
export type TextNode = Node<TextNodeData, "text">;

export type StepNodeData = WithGroup &
  WithColors & {
    step: number;
    label?: string;
    accent?: Accent;
  };
export type StepNode = Node<StepNodeData, "step">;

export type TunnelNodeData = WithGroup &
  WithColors & {
    label?: string;
    accent?: Accent;
  };
export type TunnelNode = Node<TunnelNodeData, "tunnel">;

export type LineDirection = "tl-br" | "tr-bl" | "l-r" | "t-b";
export type ArrowShape = "none" | "triangle" | "open" | "diamond" | "circle" | "bar";
export type LineNodeData = WithGroup & {
  direction?: LineDirection;
  curvature?: number;
  rotation?: number;
  arrowStart?: boolean;
  arrowEnd?: boolean;
  arrowStartShape?: ArrowShape;
  arrowEndShape?: ArrowShape;
  strokeColor?: string;
  strokeWidth?: number;
  dashed?: boolean;
};
export type LineNode = Node<LineNodeData, "line">;

export type ImageNodeData = WithGroup &
  WithColors & {
    src: string;
    alt?: string;
  };
export type ImageNode = Node<ImageNodeData, "image">;

export type CodeLanguage =
  | "plaintext"
  | "bash"
  | "javascript"
  | "typescript"
  | "tsx"
  | "jsx"
  | "json"
  | "yaml"
  | "python"
  | "go"
  | "sql"
  | "html"
  | "css"
  | "markdown";

export type CodeNodeData = WithGroup &
  WithColors & {
    code: string;
    language: CodeLanguage;
    label?: string;
  };
export type CodeNode = Node<CodeNodeData, "code">;

export type AppNode =
  | InfraNode
  | ShapeNode
  | TextNode
  | StepNode
  | TunnelNode
  | LineNode
  | ImageNode
  | CodeNode;

export type Group = {
  id: string;
  name: string;
  parentGroupId: string | null;
  collapsed?: boolean;
};

export type EdgeLineStyle = "solid" | "dashed" | "dotted";
export type LabeledEdgeData = {
  label?: string;
  turbo?: boolean;
  color?: string;
  lineStyle?: EdgeLineStyle;
  dashGap?: number;
  labelTextColor?: string;
  labelBgColor?: string;
  labelBorderColor?: string;
  architecture?: EdgeArchitecture;
};
export type LabeledEdge = Edge<LabeledEdgeData, "labeled">;

export type WorkspacePage = {
  id: string;
  name: string;
  nodes: AppNode[];
  edges: LabeledEdge[];
  groups: Group[];
};

export const DEFAULT_MARKER: EdgeMarker = {
  type: MarkerType.ArrowClosed,
  width: 18,
  height: 18,
  color: "#94a3b8",
};

export const DEFAULT_TURBO_COLORS: [string, string] = ["#ec4899", "#3b82f6"];

type Snapshot = {
  nodes: AppNode[];
  edges: LabeledEdge[];
  customBlocks: BlockDef[];
  groups: Group[];
  pages: WorkspacePage[];
  currentPageId: string;
  turbo: boolean;
  animateEdges: boolean;
  animationSpeed: number;
  turboColors: [string, string];
  edgeColor?: string;
  edgeLineStyle: EdgeLineStyle;
  edgeDashGap: number;
  showMinimap: boolean;
  showControls: boolean;
  showGrid: boolean;
  showSmartGuides: boolean;
};

type NodeDataPatch = Partial<InfraNodeData> &
  Partial<ShapeNodeData> &
  Partial<TextNodeData> &
  Partial<CodeNodeData> &
  Partial<StepNodeData> &
  Partial<TunnelNodeData> &
  Partial<LineNodeData> &
  Partial<ImageNodeData>;

type FlowState = Snapshot & {
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange<LabeledEdge>;
  onConnect: OnConnect;
  addInfraNode: (block: BlockDef, position: { x: number; y: number }) => string;
  addShapeNode: (shape: ShapeKind, position: { x: number; y: number }) => void;
  addTextNode: (position: { x: number; y: number }) => void;
  addCodeNode: (position: { x: number; y: number }) => void;
  addStepNode: (position: { x: number; y: number }) => void;
  addTunnelNode: (position: { x: number; y: number }) => void;
  addLineNode: (position: { x: number; y: number }) => void;
  addImageNode: (
    src: string,
    position: { x: number; y: number },
    size: { width: number; height: number }
  ) => void;
  updateNodeData: (id: string, patch: NodeDataPatch) => void;
  duplicateNodes: (
    ids: string[],
    offset?: { x: number; y: number }
  ) => void;
  updateEdgeLabel: (id: string, label: string) => void;
  updateEdgeArchitecture: (id: string, patch: EdgeArchitecture) => void;
  renameNode: (id: string, name: string) => void;
  deleteNode: (id: string) => void;
  selectNodes: (ids: string[]) => void;
  toggleNodeSelection: (id: string) => void;
  toggleNodeHidden: (id: string) => void;
  toggleNodeLocked: (id: string) => void;
  toggleGroupHidden: (id: string) => void;
  toggleGroupLocked: (id: string) => void;
  addCustomBlock: (block: Omit<BlockDef, "id" | "builtin">) => BlockDef;
  deleteCustomBlock: (id: string) => void;
  toggleTurbo: () => void;
  toggleAnimateEdges: () => void;
  setAnimationSpeed: (speed: number) => void;
  setTurboColor: (index: 0 | 1, color: string) => void;
  setEdgeColor: (color: string | undefined) => void;
  setEdgeLabelColor: (
    key: "text" | "bg" | "border",
    color: string | undefined
  ) => void;
  setEdgeLineStyle: (style: EdgeLineStyle) => void;
  setEdgeDashGap: (gap: number) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  groupSelected: () => void;
  createGroup: (parentGroupId?: string | null) => string;
  renameGroup: (id: string, name: string) => void;
  deleteGroup: (id: string) => void;
  toggleGroupCollapsed: (id: string) => void;
  moveNodeToGroup: (nodeId: string, groupId: string | null) => void;
  moveGroupToGroup: (id: string, parentGroupId: string | null) => void;
  moveNodeBefore: (
    nodeId: string,
    beforeNodeId: string | null,
    groupId: string | null
  ) => void;
  moveGroupBefore: (
    groupId: string,
    beforeGroupId: string | null,
    parentGroupId: string | null
  ) => void;
  clear: () => void;
  resetWorkspace: () => Promise<void>;
  replace: (snapshot: Partial<Snapshot>) => void;
  createPage: (name?: string) => string;
  switchPage: (id: string) => void;
  renamePage: (id: string, name: string) => void;
  duplicatePage: (id: string) => string;
  deletePage: (id: string) => void;
  selectAll: () => void;
  deleteSelected: () => void;
  toggleMinimap: () => void;
  toggleControls: () => void;
  toggleGrid: () => void;
  toggleSmartGuides: () => void;
};

let nodeSeq = 0;
const nextNodeId = () =>
  `n${Date.now().toString(36)}${(nodeSeq++).toString(36)}`;
const nextGroupId = () =>
  `g${Date.now().toString(36)}${(nodeSeq++).toString(36)}`;
let edgeSeq = 0;
const nextEdgeId = () =>
  `e${Date.now().toString(36)}${(edgeSeq++).toString(36)}`;
const nextBlockId = () => `custom-${Math.random().toString(36).slice(2, 10)}`;
const MAIN_PAGE_ID = "page-main";
const nextPageId = () => `p${Date.now().toString(36)}${(nodeSeq++).toString(36)}`;

const infraSize = (variant: InfraVariant) =>
  variant === "card" ? { width: 180, height: 150 } : { width: 220, height: 72 };

function currentPageSnapshot(s: Snapshot): WorkspacePage {
  const current = s.pages.find((p) => p.id === s.currentPageId);
  return {
    id: s.currentPageId || current?.id || MAIN_PAGE_ID,
    name: current?.name || "Main",
    nodes: s.nodes,
    edges: s.edges,
    groups: s.groups,
  };
}

function pagesWithCurrent(s: Snapshot): WorkspacePage[] {
  const saved = currentPageSnapshot(s);
  const exists = s.pages.some((p) => p.id === saved.id);
  return exists
    ? s.pages.map((p) => (p.id === saved.id ? saved : p))
    : [...s.pages, saved];
}

function renamedData(node: AppNode, name: string): AppNode["data"] {
  switch (node.type) {
    case "text":
      return { ...node.data, text: name } as TextNodeData;
    case "line":
    case "image":
      return node.data;
    case "code":
      return { ...node.data, label: name } as CodeNodeData;
    case "infra":
    case "shape":
    case "tunnel":
    case "step":
      return { ...node.data, label: name } as AppNode["data"];
  }
}

function descendantGroupIds(groups: Group[], rootId: string): Set<string> {
  const result = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const g of groups) {
      if (g.parentGroupId && result.has(g.parentGroupId) && !result.has(g.id)) {
        result.add(g.id);
        changed = true;
      }
    }
  }
  return result;
}

type PersistedFlowState = Partial<Snapshot>;

const memoryStorage = new Map<string, StorageValue<PersistedFlowState>>();
const pendingPersistTimers = new Map<string, ReturnType<typeof setTimeout>>();
const hasIndexedDB = () => typeof indexedDB !== "undefined";

const idbStorage: PersistStorage<PersistedFlowState> = {
  getItem: async (name) => {
    if (!hasIndexedDB()) return memoryStorage.get(name) ?? null;
    const raw = (await idbGet(name)) as string | undefined;
    return raw ? (JSON.parse(raw) as StorageValue<PersistedFlowState>) : null;
  },
  setItem: (name, value) => {
    if (pendingPersistTimers.has(name)) {
      clearTimeout(pendingPersistTimers.get(name));
    }
    if (!hasIndexedDB()) {
      memoryStorage.set(name, value);
      return;
    }
    pendingPersistTimers.set(
      name,
      setTimeout(() => {
        pendingPersistTimers.delete(name);
        void idbSet(name, JSON.stringify(value));
      }, 250)
    );
  },
  removeItem: async (name) => {
    if (pendingPersistTimers.has(name)) {
      clearTimeout(pendingPersistTimers.get(name));
      pendingPersistTimers.delete(name);
    }
    if (!hasIndexedDB()) {
      memoryStorage.delete(name);
      return;
    }
    await idbDel(name);
  },
};

export const useFlowStore = create<FlowState>()(
  persist(
    temporal(
    (set) => ({
  nodes: [],
  edges: [],
  customBlocks: [],
  groups: [],
  pages: [{ id: MAIN_PAGE_ID, name: "Main", nodes: [], edges: [], groups: [] }],
  currentPageId: MAIN_PAGE_ID,
  turbo: false,
  animateEdges: false,
  animationSpeed: 0.8,
  turboColors: DEFAULT_TURBO_COLORS,
  edgeLineStyle: "solid" as EdgeLineStyle,
  edgeDashGap: 6,
  showMinimap: true,
  showControls: true,
  showGrid: true,
  showSmartGuides: true,

  onNodesChange: (changes) =>
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),

  onEdgesChange: (changes) =>
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

  onConnect: (conn) =>
    set((s) => ({
      edges: addEdge(
        {
          ...conn,
          type: "labeled",
          data: {
              label: "",
              turbo: s.turbo,
              color: s.edgeColor,
              lineStyle: s.edgeLineStyle,
              dashGap: s.edgeDashGap,
              architecture: { ...DEFAULT_EDGE_ARCHITECTURE },
          },
          animated: s.animateEdges,
          markerEnd: s.turbo ? undefined : DEFAULT_MARKER,
        },
        s.edges
      ) as LabeledEdge[],
    })),

  addInfraNode: (block, position) => {
    const id = nextNodeId();
    set((s) => {
      const variant: InfraVariant = block.variant ?? "row";
      return {
        nodes: [
          ...s.nodes,
          {
            id,
            type: "infra",
            position,
            style: infraSize(variant),
            zIndex: 1,
            data: {
              blockId: block.id,
              label: block.label,
              subtitle: block.subtitle,
              variant,
              bgColor: block.bgColor,
              titleColor: block.titleColor,
              subtitleColor: block.subtitleColor,
              borderColor: block.borderColor,
              iconPosition: block.iconPosition,
              textAlign: block.textAlign,
              customIcon: block.customIcon,
              architecture: { ...DEFAULT_NODE_ARCHITECTURE },
            },
          },
        ],
      };
    });
    return id;
  },

  addShapeNode: (shape, position) =>
    set((s) => ({
      nodes: [
        ...s.nodes,
        {
          id: nextNodeId(),
          type: "shape",
          position,
          style:
            shape === "circle"
              ? { width: 220, height: 220 }
              : { width: 300, height: 200 },
          zIndex: 0,
          data: { shape, label: shape === "circle" ? "Circle" : "Rectangle", accent: "slate", architecture: { ...DEFAULT_NODE_ARCHITECTURE } },
        },
      ],
    })),

  addTextNode: (position) =>
    set((s) => ({
      nodes: [
        ...s.nodes,
        {
          id: nextNodeId(),
          type: "text",
          position,
          zIndex: 1,
          data: { text: "Text", accent: "amber", architecture: { ...DEFAULT_NODE_ARCHITECTURE } },
        },
      ],
    })),

  addCodeNode: (position) =>
    set((s) => ({
      nodes: [
        ...s.nodes,
        {
          id: nextNodeId(),
          type: "code",
          position,
          zIndex: 1,
          data: {
            code: "// your code here\nconst answer = 42;",
            language: "typescript",
            architecture: { ...DEFAULT_NODE_ARCHITECTURE },
          },
        },
      ],
    })),

  addStepNode: (position) =>
    set((s) => {
      const nextIndex =
        s.nodes.filter((n) => n.type === "step").length + 1;
      return {
        nodes: [
          ...s.nodes,
          {
            id: nextNodeId(),
            type: "step",
            position,
            style: { width: 56, height: 56 },
            zIndex: 1,
            data: { step: nextIndex, accent: "indigo", architecture: { ...DEFAULT_NODE_ARCHITECTURE } },
          },
        ],
      };
    }),

  addTunnelNode: (position) =>
    set((s) => ({
      nodes: [
        ...s.nodes,
        {
          id: nextNodeId(),
          type: "tunnel",
          position,
          style: { width: 260, height: 90 },
          zIndex: 0,
          data: { label: "Tunnel", accent: "sky", architecture: { ...DEFAULT_NODE_ARCHITECTURE } },
        },
      ],
    })),

  addLineNode: (position) =>
    set((s) => ({
      nodes: [
        ...s.nodes,
        {
          id: nextNodeId(),
          type: "line",
          position,
          style: { width: 200, height: 60 },
          zIndex: 1,
          data: {
            direction: "l-r",
            curvature: 0,
            rotation: 0,
            arrowStart: false,
            arrowEnd: true,
            arrowStartShape: "triangle",
            arrowEndShape: "triangle",
            strokeColor: "#94a3b8",
            strokeWidth: 2,
            dashed: false,
            architecture: { ...DEFAULT_NODE_ARCHITECTURE },
          },
        },
      ],
    })),

  addImageNode: (src, position, size) =>
    set((s) => ({
      nodes: [
        ...s.nodes,
        {
          id: nextNodeId(),
          type: "image",
          position,
          style: size,
          zIndex: 1,
          data: { src, architecture: { ...DEFAULT_NODE_ARCHITECTURE } },
        },
      ],
    })),

  duplicateNodes: (ids, offset = { x: 24, y: 24 }) =>
    set((s) => {
      const idSet = new Set(ids);
      const toClone = s.nodes.filter((n) => idSet.has(n.id));
      if (toClone.length === 0) return s;
      const idMap = new Map<string, string>();
      const clones = toClone.map((n) => {
        const newId = nextNodeId();
        idMap.set(n.id, newId);
        return {
          ...n,
          id: newId,
          position: {
            x: n.position.x + offset.x,
            y: n.position.y + offset.y,
          },
          selected: true,
          data: { ...n.data },
        } as AppNode;
      });
      const edgeClones = s.edges
        .filter((e) => idSet.has(e.source) && idSet.has(e.target))
        .map((e) => ({
          ...e,
          id: nextEdgeId(),
          source: idMap.get(e.source)!,
          target: idMap.get(e.target)!,
          selected: false,
          data: e.data ? { ...e.data } : undefined,
        }));
      const deselected = s.nodes.map((n) =>
        n.selected ? { ...n, selected: false } : n
      );
      return {
        nodes: [...deselected, ...clones],
        edges: [...s.edges, ...edgeClones],
      };
    }),

  updateNodeData: (id, patch) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id
          ? ({ ...n, data: { ...n.data, ...patch } } as AppNode)
          : n
      ),
    })),

  updateEdgeLabel: (id, label) =>
    set((s) => ({
      edges: s.edges.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, label } } : e
      ),
    })),

  updateEdgeArchitecture: (id, patch) =>
    set((s) => ({
      edges: s.edges.map((e) =>
        e.id === id
          ? {
              ...e,
              data: {
                ...(e.data ?? {}),
                architecture: {
                  ...DEFAULT_EDGE_ARCHITECTURE,
                  ...(e.data?.architecture ?? {}),
                  ...patch,
                },
              },
            }
          : e
      ),
    })),

  renameNode: (id, name) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? ({ ...n, data: renamedData(n, name) } as AppNode) : n
      ),
    })),

  deleteNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
    })),

  selectNodes: (ids) =>
    set((s) => {
      const set_ = new Set(ids);
      return {
        nodes: s.nodes.map((n) => ({ ...n, selected: set_.has(n.id) })),
      };
    }),

  toggleNodeSelection: (id) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, selected: !n.selected } : n
      ),
    })),

  toggleNodeHidden: (id) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, hidden: !n.hidden } : n
      ),
    })),

  toggleNodeLocked: (id) =>
    set((s) => ({
      nodes: s.nodes.map((n) => {
        if (n.id !== id) return n;
        const locked = !(n.draggable === false && n.selectable === false);
        return locked
          ? { ...n, draggable: false, selectable: false, selected: false }
          : { ...n, draggable: undefined, selectable: undefined };
      }),
    })),

  toggleGroupHidden: (id) =>
    set((s) => {
      const targets = descendantGroupIds(s.groups, id);
      const affected = s.nodes.filter((n) => {
        const gid = n.data.groupId ?? null;
        return gid !== null && targets.has(gid);
      });
      if (affected.length === 0) return s;
      const anyVisible = affected.some((n) => !n.hidden);
      return {
        nodes: s.nodes.map((n) => {
          const gid = n.data.groupId ?? null;
          if (gid === null || !targets.has(gid)) return n;
          return { ...n, hidden: anyVisible };
        }),
      };
    }),

  toggleGroupLocked: (id) =>
    set((s) => {
      const targets = descendantGroupIds(s.groups, id);
      const affected = s.nodes.filter((n) => {
        const gid = n.data.groupId ?? null;
        return gid !== null && targets.has(gid);
      });
      if (affected.length === 0) return s;
      const anyUnlocked = affected.some(
        (n) => !(n.draggable === false && n.selectable === false)
      );
      return {
        nodes: s.nodes.map((n) => {
          const gid = n.data.groupId ?? null;
          if (gid === null || !targets.has(gid)) return n;
          return anyUnlocked
            ? { ...n, draggable: false, selectable: false, selected: false }
            : { ...n, draggable: undefined, selectable: undefined };
        }),
      };
    }),

  addCustomBlock: (block) => {
    const def: BlockDef = { ...block, id: nextBlockId(), builtin: false };
    set((s) => ({ customBlocks: [...s.customBlocks, def] }));
    return def;
  },

  deleteCustomBlock: (id) =>
    set((s) => ({ customBlocks: s.customBlocks.filter((b) => b.id !== id) })),

  toggleTurbo: () =>
    set((s) => {
      const selectedEdges = s.edges.filter((e) => e.selected);
      const selectedNodes = s.nodes.filter((n) => n.selected);
      if (selectedEdges.length + selectedNodes.length > 0) {
        const allOn =
          selectedEdges.every((e) => e.data?.turbo) &&
          selectedNodes.every((n) => (n.data as WithColors).turbo);
        const nextFlag = !allOn;
        return {
          edges: s.edges.map((e) =>
            e.selected
              ? {
                  ...e,
                  data: { ...(e.data ?? {}), turbo: nextFlag },
                  markerEnd: nextFlag ? undefined : DEFAULT_MARKER,
                }
              : e
          ),
          nodes: s.nodes.map((n) =>
            n.selected
              ? ({
                  ...n,
                  data: { ...n.data, turbo: nextFlag },
                } as AppNode)
              : n
          ),
        };
      }
      const next = !s.turbo;
      return {
        turbo: next,
        edges: s.edges.map((e) => ({
          ...e,
          data: { ...(e.data ?? {}), turbo: next },
          markerEnd: next ? undefined : DEFAULT_MARKER,
        })),
        nodes: s.nodes.map((n) =>
          ({ ...n, data: { ...n.data, turbo: next } } as AppNode)
        ),
      };
    }),

  toggleAnimateEdges: () =>
    set((s) => {
      const selected = s.edges.filter((e) => e.selected);
      if (selected.length > 0) {
        const allAnimated = selected.every((e) => e.animated);
        const nextAnim = !allAnimated;
        return {
          edges: s.edges.map((e) =>
            e.selected
              ? {
                  ...e,
                  animated: nextAnim,
                  data: {
                    ...(e.data ?? {}),
                    lineStyle:
                      nextAnim && (e.data?.lineStyle ?? "solid") === "solid"
                        ? "dashed"
                        : e.data?.lineStyle,
                  },
                }
              : e
          ),
        };
      }
      const next = !s.animateEdges;
      const nextStyle: EdgeLineStyle =
        next && s.edgeLineStyle === "solid" ? "dashed" : s.edgeLineStyle;
      return {
        animateEdges: next,
        edgeLineStyle: nextStyle,
        edges: s.edges.map((e) => ({
          ...e,
          animated: next,
          data: {
            ...(e.data ?? {}),
            lineStyle:
              next && (e.data?.lineStyle ?? "solid") === "solid"
                ? "dashed"
                : e.data?.lineStyle,
          },
        })),
      };
    }),

  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),

  setEdgeColor: (color) =>
    set((s) => {
      const selected = s.edges.filter((e) => e.selected);
      if (selected.length > 0) {
        return {
          edges: s.edges.map((e) =>
            e.selected
              ? { ...e, data: { ...(e.data ?? {}), color } }
              : e
          ),
        };
      }
      return {
        edgeColor: color,
        edges: s.edges.map((e) => ({
          ...e,
          data: { ...(e.data ?? {}), color },
        })),
      };
    }),

  setEdgeLabelColor: (key, color) =>
    set((s) => {
      const field =
        key === "text"
          ? "labelTextColor"
          : key === "bg"
          ? "labelBgColor"
          : "labelBorderColor";
      const selected = s.edges.filter((e) => e.selected);
      const targets = selected.length > 0 ? selected : s.edges;
      const targetIds = new Set(targets.map((e) => e.id));
      return {
        edges: s.edges.map((e) =>
          targetIds.has(e.id)
            ? { ...e, data: { ...(e.data ?? {}), [field]: color } }
            : e
        ),
      };
    }),

  setEdgeLineStyle: (style) =>
    set((s) => {
      const selected = s.edges.filter((e) => e.selected);
      if (selected.length > 0) {
        return {
          edges: s.edges.map((e) =>
            e.selected
              ? { ...e, data: { ...(e.data ?? {}), lineStyle: style } }
              : e
          ),
        };
      }
      return {
        edgeLineStyle: style,
        edges: s.edges.map((e) => ({
          ...e,
          data: { ...(e.data ?? {}), lineStyle: style },
        })),
      };
    }),

  setEdgeDashGap: (gap) =>
    set((s) => {
      const selected = s.edges.filter((e) => e.selected);
      if (selected.length > 0) {
        return {
          edges: s.edges.map((e) =>
            e.selected
              ? { ...e, data: { ...(e.data ?? {}), dashGap: gap } }
              : e
          ),
        };
      }
      return {
        edgeDashGap: gap,
        edges: s.edges.map((e) => ({
          ...e,
          data: { ...(e.data ?? {}), dashGap: gap },
        })),
      };
    }),

  setTurboColor: (index, color) =>
    set((s) => {
      const next = [...s.turboColors] as [string, string];
      next[index] = color;
      return { turboColors: next };
    }),

  bringToFront: (id) =>
    set((s) => {
      const maxZ = s.nodes.reduce((m, n) => Math.max(m, n.zIndex ?? 0), 0);
      return {
        nodes: s.nodes.map((n) =>
          n.id === id ? ({ ...n, zIndex: maxZ + 1 } as AppNode) : n
        ),
      };
    }),

  sendToBack: (id) =>
    set((s) => {
      const minZ = s.nodes.reduce((m, n) => Math.min(m, n.zIndex ?? 0), 0);
      return {
        nodes: s.nodes.map((n) =>
          n.id === id ? ({ ...n, zIndex: minZ - 1 } as AppNode) : n
        ),
      };
    }),

  bringForward: (id) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? ({ ...n, zIndex: (n.zIndex ?? 0) + 1 } as AppNode) : n
      ),
    })),

  sendBackward: (id) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? ({ ...n, zIndex: (n.zIndex ?? 0) - 1 } as AppNode) : n
      ),
    })),

  groupSelected: () =>
    set((s) => {
      const selected = s.nodes.filter((n) => n.selected);
      if (selected.length < 1) return s;
      const groupId = nextGroupId();
      const group: Group = {
        id: groupId,
        name: "Group",
        parentGroupId: null,
      };
      const selectedIds = new Set(selected.map((n) => n.id));
      return {
        groups: [...s.groups, group],
        nodes: s.nodes.map((n) =>
          selectedIds.has(n.id)
            ? ({ ...n, data: { ...n.data, groupId } } as AppNode)
            : n
        ),
      };
    }),

  createGroup: (parentGroupId = null) => {
    const id = nextGroupId();
    const g: Group = { id, name: "Group", parentGroupId: parentGroupId ?? null };
    set((s) => ({ groups: [...s.groups, g] }));
    return id;
  },

  renameGroup: (id, name) =>
    set((s) => ({
      groups: s.groups.map((g) => (g.id === id ? { ...g, name } : g)),
    })),

  deleteGroup: (id) =>
    set((s) => {
      const toRemove = descendantGroupIds(s.groups, id);
      const parent = s.groups.find((g) => g.id === id)?.parentGroupId ?? null;
      return {
        groups: s.groups
          .filter((g) => !toRemove.has(g.id))
          .map((g) =>
            toRemove.has(g.parentGroupId ?? "")
              ? { ...g, parentGroupId: parent }
              : g
          ),
        nodes: s.nodes.map((n) => {
          const gid = n.data.groupId ?? null;
          if (gid && toRemove.has(gid)) {
            return {
              ...n,
              data: { ...n.data, groupId: parent },
            } as AppNode;
          }
          return n;
        }),
      };
    }),

  toggleGroupCollapsed: (id) =>
    set((s) => ({
      groups: s.groups.map((g) =>
        g.id === id ? { ...g, collapsed: !g.collapsed } : g
      ),
    })),

  moveNodeToGroup: (nodeId, groupId) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId
          ? ({ ...n, data: { ...n.data, groupId } } as AppNode)
          : n
      ),
    })),

  moveGroupToGroup: (id, parentGroupId) =>
    set((s) => {
      if (id === parentGroupId) return s;
      if (parentGroupId && descendantGroupIds(s.groups, id).has(parentGroupId)) {
        return s;
      }
      return {
        groups: s.groups.map((g) =>
          g.id === id ? { ...g, parentGroupId: parentGroupId ?? null } : g
        ),
      };
    }),

  moveNodeBefore: (nodeId, beforeNodeId, groupId) =>
    set((s) => {
      if (nodeId === beforeNodeId) return s;
      const idx = s.nodes.findIndex((n) => n.id === nodeId);
      if (idx === -1) return s;
      const updated: AppNode = {
        ...s.nodes[idx],
        data: { ...s.nodes[idx].data, groupId: groupId ?? null },
      } as AppNode;
      const without = s.nodes.filter((_, i) => i !== idx);
      if (!beforeNodeId) {
        return { nodes: [...without, updated] };
      }
      const beforeIdx = without.findIndex((n) => n.id === beforeNodeId);
      if (beforeIdx === -1) return { nodes: [...without, updated] };
      const next = [...without];
      next.splice(beforeIdx, 0, updated);
      return { nodes: next };
    }),

  moveGroupBefore: (groupId, beforeGroupId, parentGroupId) =>
    set((s) => {
      if (groupId === beforeGroupId) return s;
      if (groupId === parentGroupId) return s;
      if (parentGroupId && descendantGroupIds(s.groups, groupId).has(parentGroupId)) {
        return s;
      }
      const idx = s.groups.findIndex((g) => g.id === groupId);
      if (idx === -1) return s;
      const updated: Group = {
        ...s.groups[idx],
        parentGroupId: parentGroupId ?? null,
      };
      const without = s.groups.filter((_, i) => i !== idx);
      if (!beforeGroupId) {
        return { groups: [...without, updated] };
      }
      const beforeIdx = without.findIndex((g) => g.id === beforeGroupId);
      if (beforeIdx === -1) return { groups: [...without, updated] };
      const next = [...without];
      next.splice(beforeIdx, 0, updated);
      return { groups: next };
    }),

  clear: () =>
    set((s) => ({
      nodes: [],
      edges: [],
      groups: [],
      pages: pagesWithCurrent({ ...s, nodes: [], edges: [], groups: [] }),
    })),

  resetWorkspace: async () => {
    try {
      await useFlowStore.persist.clearStorage();
    } catch {
      await idbDel("netviz-store-v1");
    }
    window.location.reload();
  },

  replace: (snapshot) =>
    set((s) => {
      const next = { ...s, ...snapshot };
      const pages =
        snapshot.pages ??
        pagesWithCurrent({
          ...next,
          pages: s.pages.length
            ? s.pages
            : [
                {
                  id: MAIN_PAGE_ID,
                  name: "Main",
                  nodes: next.nodes,
                  edges: next.edges,
                  groups: next.groups,
                },
              ],
        });
      const currentPageId =
        snapshot.currentPageId ??
        pages.find((p) => p.id === s.currentPageId)?.id ??
        pages[0]?.id ??
        MAIN_PAGE_ID;
      const current = pages.find((p) => p.id === currentPageId) ?? pages[0];
      return {
        ...next,
        pages,
        currentPageId: current.id,
        nodes: current.nodes,
        edges: current.edges,
        groups: current.groups,
      };
    }),

  createPage: (name = "Untitled") => {
    const id = nextPageId();
    set((s) => ({
      pages: [
        ...pagesWithCurrent(s),
        { id, name: name.trim() || "Untitled", nodes: [], edges: [], groups: [] },
      ],
    }));
    return id;
  },

  switchPage: (id) =>
    set((s) => {
      const pages = pagesWithCurrent(s);
      const page = pages.find((p) => p.id === id);
      if (!page) return s;
      return {
        pages,
        currentPageId: page.id,
        nodes: page.nodes,
        edges: page.edges,
        groups: page.groups,
      };
    }),

  renamePage: (id, name) =>
    set((s) => ({
      pages: pagesWithCurrent(s).map((p) =>
        p.id === id ? { ...p, name: name.trim() || "Untitled" } : p
      ),
    })),

  duplicatePage: (id) => {
    const newId = nextPageId();
    set((s) => {
      const pages = pagesWithCurrent(s);
      const page = pages.find((p) => p.id === id);
      if (!page) return s;
      return {
        pages: [
          ...pages,
          {
            ...page,
            id: newId,
            name: `${page.name} copy`,
            nodes: page.nodes.map((n) => ({ ...n, data: { ...n.data } } as AppNode)),
            edges: page.edges.map((e) => ({
              ...e,
              data: e.data ? { ...e.data } : undefined,
            })),
            groups: page.groups.map((g) => ({ ...g })),
          },
        ],
      };
    });
    return newId;
  },

  deletePage: (id) =>
    set((s) => {
      const pages = pagesWithCurrent(s);
      if (pages.length <= 1) return s;
      const nextPages = pages.filter((p) => p.id !== id);
      if (nextPages.length === pages.length) return s;
      const nextCurrent =
        s.currentPageId === id
          ? nextPages[0]
          : nextPages.find((p) => p.id === s.currentPageId) ?? nextPages[0];
      return {
        pages: nextPages,
        currentPageId: nextCurrent.id,
        nodes: nextCurrent.nodes,
        edges: nextCurrent.edges,
        groups: nextCurrent.groups,
      };
    }),

  selectAll: () =>
    set((s) => ({
      nodes: s.nodes.map((n) => ({ ...n, selected: true })),
      edges: s.edges.map((e) => ({ ...e, selected: true })),
    })),

  deleteSelected: () =>
    set((s) => {
      const removedNodeIds = new Set(
        s.nodes.filter((n) => n.selected).map((n) => n.id)
      );
      return {
        nodes: s.nodes.filter((n) => !n.selected),
        edges: s.edges.filter(
          (e) =>
            !e.selected &&
            !removedNodeIds.has(e.source) &&
            !removedNodeIds.has(e.target)
        ),
      };
    }),

  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
  toggleControls: () => set((s) => ({ showControls: !s.showControls })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSmartGuides: () =>
    set((s) => ({ showSmartGuides: !s.showSmartGuides })),
    }),
    {
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        groups: state.groups,
        pages: state.pages,
        currentPageId: state.currentPageId,
        customBlocks: state.customBlocks,
      }),
      limit: 100,
      equality: (a, b) =>
        a.nodes === b.nodes &&
        a.edges === b.edges &&
        a.groups === b.groups &&
        a.customBlocks === b.customBlocks,
      handleSet: (handleSet) => {
        let t: ReturnType<typeof setTimeout> | null = null;
        return ((...args: Parameters<typeof handleSet>) => {
          if (t) clearTimeout(t);
          t = setTimeout(() => handleSet(...args), 300);
        }) as typeof handleSet;
      },
    }
    ),
    {
      name: "netviz-store-v1",
      storage: idbStorage,
      partialize: (s) => ({
        nodes: s.nodes,
        edges: s.edges,
        customBlocks: s.customBlocks,
        groups: s.groups,
        pages: pagesWithCurrent(s),
        currentPageId: s.currentPageId,
        turbo: s.turbo,
        animateEdges: s.animateEdges,
        animationSpeed: s.animationSpeed,
        turboColors: s.turboColors,
        edgeColor: s.edgeColor,
        edgeLineStyle: s.edgeLineStyle,
        edgeDashGap: s.edgeDashGap,
        showMinimap: s.showMinimap,
        showControls: s.showControls,
        showGrid: s.showGrid,
        showSmartGuides: s.showSmartGuides,
      }),
    }
  )
);

export function resolveBlock(
  blockId: string,
  customBlocks: BlockDef[]
): BlockDef | undefined {
  return (
    CORE_BLOCKS.find((b) => b.id === blockId) ??
    customBlocks.find((b) => b.id === blockId)
  );
}

export function getNodeDisplayName(node: AppNode): string {
  switch (node.type) {
    case "infra":
      return node.data.label || "Block";
    case "shape":
      return (
        node.data.label ||
        (node.data.shape === "circle" ? "Circle" : "Rectangle")
      );
    case "text":
      return (node.data.text || "Text").split("\n")[0].slice(0, 40);
    case "step":
      return node.data.label || `Step ${node.data.step}`;
    case "tunnel":
      return node.data.label || "Tunnel";
    case "line":
      return "Line";
    case "image":
      return node.data.alt || "Image";
    case "code":
      return node.data.label || `Code (${node.data.language})`;
  }
}
