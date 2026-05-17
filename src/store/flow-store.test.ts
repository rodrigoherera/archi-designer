import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_NODE_ARCHITECTURE,
  DEFAULT_EDGE_ARCHITECTURE,
  useFlowStore,
  type AppNode,
} from "./flow-store";

beforeEach(() => {
  vi.useFakeTimers();
  useFlowStore.setState({
    nodes: [],
    edges: [],
    groups: [],
    customBlocks: [],
    pages: [{ id: "page-main", name: "Main", nodes: [], edges: [], groups: [] }],
    currentPageId: "page-main",
  });
});

describe("architecture metadata", () => {
  it("adds default metadata to new architecture nodes and edges", () => {
    const id = useFlowStore
      .getState()
      .addInfraNode(
        { id: "server", label: "Server", iconName: "server", accent: "indigo", builtin: true },
        { x: 0, y: 0 }
      );
    useFlowStore.getState().addInfraNode(
      { id: "database", label: "Database", iconName: "database", accent: "amber", builtin: true },
      { x: 200, y: 0 }
    );
    const dbId = useFlowStore.getState().nodes[1].id;

    expect(useFlowStore.getState().nodes[0].data.architecture).toEqual(
      DEFAULT_NODE_ARCHITECTURE
    );

    useFlowStore.getState().onConnect({
      source: id,
      target: dbId,
      sourceHandle: null,
      targetHandle: null,
    });
    expect(useFlowStore.getState().edges[0].data?.architecture).toEqual(
      DEFAULT_EDGE_ARCHITECTURE
    );
  });

  it("updates edge architecture metadata", () => {
    useFlowStore.setState({
      edges: [
        {
          id: "e1",
          source: "a",
          target: "b",
          type: "labeled",
          data: { architecture: DEFAULT_EDGE_ARCHITECTURE },
        },
      ],
    });

    useFlowStore.getState().updateEdgeArchitecture("e1", {
      protocol: "HTTPS",
      port: "443",
    });

    expect(useFlowStore.getState().edges[0].data?.architecture).toMatchObject({
      protocol: "HTTPS",
      port: "443",
    });
  });
});

describe("workspace pages", () => {
  it("creates, switches, renames, duplicates, and deletes pages", () => {
    useFlowStore.setState({
      nodes: [
        {
          id: "n1",
          type: "text",
          position: { x: 0, y: 0 },
          data: { text: "Overview" },
        } as AppNode,
      ],
    });

    const securityId = useFlowStore.getState().createPage("Security");
    expect(useFlowStore.getState().pages.map((p) => p.name)).toEqual([
      "Main",
      "Security",
    ]);

    useFlowStore.getState().switchPage(securityId);
    expect(useFlowStore.getState().nodes).toEqual([]);

    useFlowStore.getState().renamePage(securityId, "Threat Model");
    expect(useFlowStore.getState().pages.find((p) => p.id === securityId)?.name).toBe(
      "Threat Model"
    );

    const duplicateId = useFlowStore.getState().duplicatePage("page-main");
    expect(useFlowStore.getState().pages.find((p) => p.id === duplicateId)?.name).toBe(
      "Main copy"
    );

    useFlowStore.getState().deletePage(securityId);
    expect(useFlowStore.getState().pages.some((p) => p.id === securityId)).toBe(false);
    expect(useFlowStore.getState().pages).toHaveLength(2);
  });
});
