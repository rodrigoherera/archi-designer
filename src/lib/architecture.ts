import { resolveBlock, getNodeDisplayName, type AppNode, type Group, type LabeledEdge } from "@/store/flow-store";

export type ArchitectureInput = {
  nodes: AppNode[];
  edges: LabeledEdge[];
  groups: Group[];
};

export type ComponentSummary = {
  id: string;
  name: string;
  kind: AppNode["type"];
  category: string;
  environment: string;
  trustZone: string;
  dataClassification: string;
  group?: string;
};

export type FlowSummary = {
  source: string;
  target: string;
  label: string;
  protocol: string;
  port: string;
  dataFlow: string;
};

export type ArchitectureSummary = {
  components: ComponentSummary[];
  environments: Record<string, ComponentSummary[]>;
  trustZones: Record<string, ComponentSummary[]>;
  dataFlows: FlowSummary[];
  externalDependencies: ComponentSummary[];
  risks: string[];
  assumptions: string[];
};

const fallback = (value: string | undefined, label: string) =>
  value && value.trim() ? value.trim() : label;

const escapeMd = (value: string) => value.replace(/\|/g, "\\|");
const escapeMermaid = (value: string) => value.replace(/"/g, '\\"');

function groupName(groups: Group[], id: string | null | undefined) {
  if (!id) return undefined;
  return groups.find((g) => g.id === id)?.name;
}

function shapeFor(node: AppNode, label: string) {
  const safe = escapeMermaid(label);
  if (node.type === "infra" && node.data.blockId === "database") return `[("${safe}")]`;
  if (node.type === "shape") return `["${safe}"]`;
  return `["${safe}"]`;
}

export function generateArchitectureSummary({
  nodes,
  edges,
  groups,
}: ArchitectureInput): ArchitectureSummary {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const components = nodes
    .filter((n) => !n.hidden)
    .map((node) => {
      const arch = node.data.architecture;
      const blockCategory =
        node.type === "infra" ? resolveBlock(node.data.blockId, [])?.id : undefined;
      return {
        id: node.id,
        name: getNodeDisplayName(node),
        kind: node.type,
        category: fallback(arch?.category, blockCategory ?? node.type),
        environment: fallback(arch?.environment, "unspecified"),
        trustZone: fallback(arch?.trustZone, "unspecified"),
        dataClassification: fallback(arch?.dataClassification, "unspecified"),
        group: groupName(groups, node.data.groupId),
      };
    });
  const componentById = new Map(components.map((c) => [c.id, c]));

  const dataFlows = edges
    .map((edge) => {
      const source = componentById.get(edge.source);
      const target = componentById.get(edge.target);
      if (!source || !target) return null;
      const arch = edge.data?.architecture;
      return {
        source: source.name,
        target: target.name,
        label: fallback(edge.data?.label, "flow"),
        protocol: fallback(arch?.protocol, "unspecified"),
        port: fallback(arch?.port, "unspecified"),
        dataFlow: fallback(arch?.dataFlow, "unspecified"),
      };
    })
    .filter((flow): flow is FlowSummary => flow !== null);

  const environments: Record<string, ComponentSummary[]> = {};
  const trustZones: Record<string, ComponentSummary[]> = {};
  for (const component of components) {
    (environments[component.environment] ??= []).push(component);
    (trustZones[component.trustZone] ??= []).push(component);
  }

  const externalDependencies = components.filter(
    (component) =>
      component.category === "external" ||
      component.category === "service-provider" ||
      component.trustZone === "external"
  );

  const risks: string[] = [];
  for (const edge of edges) {
    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);
    const source = componentById.get(edge.source);
    const target = componentById.get(edge.target);
    if (!source || !target || !sourceNode || !targetNode) continue;
    if (source.trustZone === "public" && target.trustZone === "private") {
      risks.push(
        `Public component "${source.name}" connects directly to private component "${target.name}".`
      );
    }
  }

  return {
    components,
    environments,
    trustZones,
    dataFlows,
    externalDependencies,
    risks,
    assumptions:
      components.length === 0
        ? ["No components are currently present in this diagram."]
        : [],
  };
}

export function exportArchitectureMarkdown(input: ArchitectureInput) {
  const summary = generateArchitectureSummary(input);
  const lines = [
    "# Architecture Summary",
    "",
    "## Components",
    "",
    "| Component | Category | Environment | Trust Zone | Data |",
    "| --- | --- | --- | --- | --- |",
    ...summary.components.map(
      (c) =>
        `| ${escapeMd(c.name)} | ${escapeMd(c.category)} | ${escapeMd(c.environment)} | ${escapeMd(c.trustZone)} | ${escapeMd(c.dataClassification)} |`
    ),
    "",
    "## Data Flows",
    "",
    "| Source | Target | Label | Protocol | Port | Data |",
    "| --- | --- | --- | --- | --- | --- |",
    ...summary.dataFlows.map(
      (f) =>
        `| ${escapeMd(f.source)} | ${escapeMd(f.target)} | ${escapeMd(f.label)} | ${escapeMd(f.protocol)} | ${escapeMd(f.port)} | ${escapeMd(f.dataFlow)} |`
    ),
    "",
    "## Risks",
    "",
    ...(summary.risks.length > 0
      ? summary.risks.map((risk) => `- ${risk}`)
      : ["- No rule-based risks detected."]),
  ];
  return `${lines.join("\n")}\n`;
}

export function exportArchitectureMermaid(input: ArchitectureInput) {
  const visibleNodes = input.nodes.filter((n) => !n.hidden);
  const nodeIds = new Set(visibleNodes.map((n) => n.id));
  const lines = ["flowchart LR"];
  for (const node of visibleNodes) {
    lines.push(`  ${node.id}${shapeFor(node, getNodeDisplayName(node))}`);
  }
  for (const edge of input.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    const arch = edge.data?.architecture;
    const label = [
      edge.data?.label?.trim(),
      arch?.protocol && arch?.port
        ? `${arch.protocol}:${arch.port}`
        : arch?.protocol ?? arch?.port,
    ]
      .filter(Boolean)
      .join(" ");
    lines.push(
      label
        ? `  ${edge.source} -->|"${escapeMermaid(label)}"| ${edge.target}`
        : `  ${edge.source} --> ${edge.target}`
    );
  }
  return `${lines.join("\n")}\n`;
}
