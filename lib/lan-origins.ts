import os from "node:os";

export const PRIVATE_LAN_ORIGIN_PATTERNS = [
  "192.168.*.*",
  "10.*.*.*",
  "172.*.*.*",
  "*.local",
] as const;

export function lanDevOrigins(
  interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]> = os.networkInterfaces(),
): string[] {
  const ips: string[] = [];
  for (const addrs of Object.values(interfaces)) {
    for (const addr of addrs ?? []) {
      const ipv4 = addr.family === "IPv4";
      if (ipv4 && !addr.internal) {
        ips.push(addr.address);
      }
    }
  }
  return [...PRIVATE_LAN_ORIGIN_PATTERNS, ...ips];
}
