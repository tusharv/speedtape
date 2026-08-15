import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { APP_NAME } from "@/lib/site";
import {
  COLLECTOR_BUNDLE_ID,
  collectorAppExecutablePath,
  collectorAppPath,
} from "@/lib/paths";

export type CollectorAppCommand = {
  homeDir: string;
  nodePath: string;
  tsxPath: string;
  scriptPath: string;
  workdir: string;
  pathEnv: string;
};

const ICON_SIZE = 256;

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type), data]);
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  body.copy(chunk, 4);
  chunk.writeUInt32BE(crc32(body), 8 + data.length);
  return chunk;
}

function inRoundedRect(
  x: number,
  y: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
  radius: number,
): boolean {
  if (x < left || x > right || y < top || y > bottom) return false;
  const cx = x < left + radius ? left + radius : x > right - radius ? right - radius : x;
  const cy = y < top + radius ? top + radius : y > bottom - radius ? bottom - radius : y;
  if (cx === x || cy === y) return true;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function brandPixel(x: number, y: number): [number, number, number] {
  const scale = ICON_SIZE / 64;
  const inIcon = inRoundedRect(x, y, 2, 2, ICON_SIZE - 3, ICON_SIZE - 3, 12 * scale);
  if (!inIcon) return [0, 0, 0];
  const bars: Array<[number, number, number, number]> = [
    [14, 37, 9, 13],
    [28, 27, 9, 23],
    [42, 14, 9, 36],
  ];
  for (const [bx, by, bw, bh] of bars) {
    const left = bx * scale;
    const top = by * scale;
    if (x >= left && x < left + bw * scale && y >= top && y < top + bh * scale) {
      return [0x2d, 0xd4, 0xbf];
    }
  }
  return [0x09, 0x09, 0x0b];
}

export function brandIconPng(size = ICON_SIZE): Buffer {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b] = brandPixel(x, y);
      const i = row + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

export function pngToIcns(png: Buffer): Buffer {
  const entrySize = 8 + png.length;
  const out = Buffer.alloc(8 + entrySize);
  out.write("icns", 0);
  out.writeUInt32BE(out.length, 4);
  out.write("ic08", 8);
  out.writeUInt32BE(entrySize, 12);
  png.copy(out, 16);
  return out;
}

function shQuote(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

function infoPlist(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleDisplayName</key>
  <string>${APP_NAME}</string>
  <key>CFBundleExecutable</key>
  <string>Speedtape</string>
  <key>CFBundleIconFile</key>
  <string>AppIcon</string>
  <key>CFBundleIdentifier</key>
  <string>${COLLECTOR_BUNDLE_ID}</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>${APP_NAME}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
  <key>LSUIElement</key>
  <true/>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
`;
}

function wrapperScript(command: CollectorAppCommand): string {
  return `#!/bin/bash
export PATH=${shQuote(command.pathEnv)}
cd ${shQuote(command.workdir)}
exec ${shQuote(command.nodePath)} ${shQuote(command.tsxPath)} ${shQuote(command.scriptPath)}
`;
}

function registerApp(appPath: string): void {
  const lsregister =
    "/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister";
  if (!fs.existsSync(lsregister)) return;
  try {
    execFileSync(lsregister, ["-f", appPath], { stdio: "pipe" });
  } catch {
    // Login Items still picks up the bundle from AssociatedBundleIdentifiers.
  }
}

export function ensureCollectorApp(command: CollectorAppCommand): string {
  const appPath = collectorAppPath(command.homeDir);
  const contents = path.join(appPath, "Contents");
  const macOs = path.join(contents, "MacOS");
  const resources = path.join(contents, "Resources");
  fs.mkdirSync(macOs, { recursive: true });
  fs.mkdirSync(resources, { recursive: true });
  fs.writeFileSync(path.join(contents, "Info.plist"), infoPlist());
  fs.writeFileSync(path.join(contents, "PkgInfo"), "APPL????");
  fs.writeFileSync(path.join(resources, "AppIcon.icns"), pngToIcns(brandIconPng()));
  const bin = collectorAppExecutablePath(command.homeDir);
  fs.writeFileSync(bin, wrapperScript(command), { mode: 0o755 });
  fs.chmodSync(bin, 0o755);
  registerApp(appPath);
  return appPath;
}

export function removeCollectorApp(homeDir: string): void {
  const appPath = collectorAppPath(homeDir);
  fs.rmSync(appPath, { recursive: true, force: true });
}
