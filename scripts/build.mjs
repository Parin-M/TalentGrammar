import { cp, mkdir, rm } from "node:fs/promises";
import { build } from "esbuild";

const out = "dist";
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp("manifest.json", out + "/manifest.json");
await cp("popup", out + "/popup", { recursive: true });
await cp("options", out + "/options", { recursive: true });
await cp("src", out + "/src", { recursive: true });
await build({ entryPoints: ["src/content.js", "src/background.js"], outdir: out + "/src", bundle: true, format: "iife", target: "chrome120" });
console.log("Built extension in dist/");
