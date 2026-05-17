import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Cloud,
  Container,
  Cpu,
  Database,
  Globe,
  HardDrive,
  KeyRound,
  Laptop,
  Layers,
  Lock,
  Scale,
  Server,
  Shield,
  Smartphone,
  TrendingUpDown,
  Users,
  Wifi,
  Zap,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

export type IconName = string;

function toPascal(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

const LEGACY_MAP: Record<string, string> = {
  server: "Server",
  database: "Database",
  firewall: "Shield",
  container: "Container",
  loadbalancer: "Scale",
  proxy: "TrendingUpDown",
  cloud: "Cloud",
  globe: "Globe",
  laptop: "Laptop",
  smartphone: "Smartphone",
  cpu: "Cpu",
  disk: "HardDrive",
  wifi: "Wifi",
  lock: "Lock",
  users: "Users",
  box: "Box",
  layers: "Layers",
  zap: "Zap",
  key: "KeyRound",
};

const STATIC_ICONS: Record<string, LucideIcon> = {
  Box,
  Cloud,
  Container,
  Cpu,
  Database,
  Globe,
  HardDrive,
  KeyRound,
  Laptop,
  Layers,
  Lock,
  Scale,
  Server,
  Shield,
  Smartphone,
  TrendingUpDown,
  Users,
  Wifi,
  Zap,
};

function isIconComponent(v: unknown): v is LucideIcon {
  return (
    v !== null &&
    typeof v === "object" &&
    "$$typeof" in (v as object) &&
    "render" in (v as object)
  );
}

export function resolveIcon(name: string | undefined): LucideIcon {
  if (!name) return Box;
  const legacy = LEGACY_MAP[name];
  if (legacy && STATIC_ICONS[legacy]) return STATIC_ICONS[legacy];
  const pascal = toPascal(name);
  if (STATIC_ICONS[name]) return STATIC_ICONS[name];
  if (STATIC_ICONS[pascal]) return STATIC_ICONS[pascal];
  return Box;
}

let iconNamesPromise: Promise<string[]> | null = null;

export function getLucideIconNames(): Promise<string[]> {
  iconNamesPromise ??= import("lucide-react").then((icons) =>
    Object.keys(icons)
      .filter((k) => {
        if (!/^[A-Z]/.test(k) || k.endsWith("Icon")) return false;
        const v = (icons as Record<string, unknown>)[k];
        if (!isIconComponent(v)) return false;
        const display = (v as { displayName?: string }).displayName;
        return !display || display === k;
      })
      .sort()
  );
  return iconNamesPromise;
}

const asyncIconCache = new Map<string, LucideIcon>();

export function ResolvedIcon({
  name,
  ...props
}: LucideProps & { name: string | undefined }) {
  const staticIcon = useMemo(() => resolveIcon(name), [name]);
  const needsAsyncIcon =
    !!name && staticIcon === Box && toPascal(name) !== "Box" && name !== "box";
  const [AsyncIcon, setAsyncIcon] = useState<LucideIcon | null>(() =>
    name ? asyncIconCache.get(name) ?? null : null
  );

  useEffect(() => {
    let cancelled = false;
    if (!name || !needsAsyncIcon) {
      setAsyncIcon(null);
      return;
    }
    const cached = asyncIconCache.get(name);
    if (cached) {
      setAsyncIcon(cached);
      return;
    }
    import("lucide-react").then((icons) => {
      if (cancelled) return;
      const lib = icons as Record<string, unknown>;
      const direct = lib[name];
      const pascal = lib[toPascal(name)];
      const icon = isIconComponent(direct)
        ? direct
        : isIconComponent(pascal)
          ? pascal
          : null;
      if (icon) asyncIconCache.set(name, icon);
      setAsyncIcon(icon);
    });
    return () => {
      cancelled = true;
    };
  }, [name, needsAsyncIcon]);

  const Icon = AsyncIcon ?? staticIcon;
  return <Icon {...props} />;
}
