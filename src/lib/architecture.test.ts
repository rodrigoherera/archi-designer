import { describe, expect, it } from "vitest";
import {
  generateArchitectureSummary,
  exportArchitectureMarkdown,
  exportArchitectureMermaid,
} from "./architecture";
import type { AppNode, LabeledEdge } from "@/store/flow-store";

const nodes = [
  {
    id: "web",
    type: "infra",
    position: { x: 0, y: 0 },
    data: {
      blockId: "server",
      label: "Web App",
      architecture: {
        category: "compute",
        environment: "production",
        trustZone: "public",
        dataClassification: "user-data",
      },
    },
  },
  {
    id: "db",
    type: "infra",
    position: { x: 300, y: 0 },
    data: {
      blockId: "database",
      label: "Primary DB",
      architecture: {
        category: "database",
        environment: "production",
        trustZone: "private",
        dataClassification: "sensitive",
      },
    },
  },
] satisfies AppNode[];

const edges = [
  {
    id: "e1",
    source: "web",
    target: "db",
    type: "labeled",
    data: {
      label: "Reads/Writes",
      architecture: {
        protocol: "PostgreSQL",
        port: "5432",
        dataFlow: "Customer records",
      },
    },
  },
] satisfies LabeledEdge[];

describe("architecture documentation exports", () => {
  it("summarizes components, environments, zones, flows, and risks", () => {
    const summary = generateArchitectureSummary({ nodes, edges, groups: [] });

    expect(summary.components).toHaveLength(2);
    expect(summary.components[0]).toMatchObject({
      id: "web",
      name: "Web App",
      category: "compute",
      environment: "production",
      trustZone: "public",
    });
    expect(summary.environments.production.map((c) => c.name)).toEqual([
      "Web App",
      "Primary DB",
    ]);
    expect(summary.trustZones.public.map((c) => c.name)).toEqual(["Web App"]);
    expect(summary.dataFlows[0]).toMatchObject({
      source: "Web App",
      target: "Primary DB",
      protocol: "PostgreSQL",
      port: "5432",
      dataFlow: "Customer records",
    });
    expect(summary.risks).toContain(
      "Public component \"Web App\" connects directly to private component \"Primary DB\"."
    );
  });

  it("exports markdown with components and data flows", () => {
    const markdown = exportArchitectureMarkdown({ nodes, edges, groups: [] });

    expect(markdown).toContain("# Architecture Summary");
    expect(markdown).toContain("| Web App | compute | production | public | user-data |");
    expect(markdown).toContain("| Web App | Primary DB | Reads/Writes | PostgreSQL | 5432 | Customer records |");
  });

  it("exports mermaid component/data-flow graph", () => {
    const mermaid = exportArchitectureMermaid({ nodes, edges, groups: [] });

    expect(mermaid).toContain("flowchart LR");
    expect(mermaid).toContain('web["Web App"]');
    expect(mermaid).toContain('db[("Primary DB")]');
    expect(mermaid).toContain('web -->|"Reads/Writes PostgreSQL:5432"| db');
  });
});
