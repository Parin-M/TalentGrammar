import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { loadTinyfix } from "tinyfix";
import { normalizePersian, suggestPersian } from "../src/persian.js";

const manifest = JSON.parse(await readFile("dist/manifest.json", "utf8"));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.name, "TalentGrammar");
assert.equal(manifest.background.service_worker, "src/background.js");
assert.equal(manifest.background.type, "module");
assert.ok(manifest.permissions.includes("storage"));
assert.ok(manifest.permissions.includes("contextMenus"));

for (const file of [
  "dist/src/background.js",
  "dist/src/content.js",
  "dist/models/tinyfix/wrong-word.onnx",
  "dist/models/tinyfix/words.txt",
  "dist/models/tinyfix/wrong-word-vocab.txt",
  "dist/models/tinyfix/wrong-word-confusions.txt",
  "dist/models/shekar/fa-vocab.json",
]) {
  assert.ok((await stat(file)).size > 0, file + " must exist and be non-empty");
}

const vocabularyRows = JSON.parse(await readFile("dist/models/shekar/fa-vocab.json", "utf8"));
assert.ok(vocabularyRows.length > 1000, "Shekar vocabulary should contain a useful number of words");
assert.equal(normalizePersian("كِتاب ي"), normalizePersian("کِتاب ی"));

const vocabulary = new Map(vocabularyRows.map(([word, count]) => [normalizePersian(word), Number(count) || 1]));
const commonWord = vocabularyRows
  .map(([word, count]) => [normalizePersian(word), Number(count) || 1])
  .filter(([word]) => /[\u0600-\u06ff]/.test(word) && word.length > 3)
  .sort((a, b) => b[1] - a[1])[0]?.[0];
assert.ok(commonWord, "Persian vocabulary must contain words");
const typo = ["ژ", "ظ", "ث", "ض", "غ", "ق", "پ", "چ"]
  .map((prefix) => prefix + commonWord)
  .find((candidate) => !vocabulary.has(candidate));
assert.ok(typo, "could not generate an unknown Persian typo");
const persianFix = suggestPersian(typo, vocabulary);
assert.ok(persianFix, "Persian correction engine should suggest a vocabulary candidate");
assert.ok(vocabulary.has(persianFix.replacement), "Persian suggestion must be in the bundled vocabulary");

const root = resolve("dist");
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname).replace(/^\/+/, "");
    const file = resolve(root, pathname);
    if (file !== root && !file.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    const data = await readFile(file);
    if (file.endsWith(".wasm")) response.setHeader("Content-Type", "application/wasm");
    else if (file.endsWith(".txt")) response.setHeader("Content-Type", "text/plain; charset=utf-8");
    else response.setHeader("Content-Type", "application/octet-stream");
    response.writeHead(200).end(data);
  } catch {
    response.writeHead(404).end("not found");
  }
});

await new Promise((resolveListen, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolveListen);
});

let tinyfix;
try {
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}/`;
  tinyfix = await loadTinyfix({
    baseUrl: new URL("models/tinyfix/", origin).href,
    mode: "careful",
  });

  const sample = "I got a letter form the bank.";
  const fixes = await tinyfix.check(sample, { range: [15, 19] });
  assert.ok(
    fixes.some((fix) => fix.original === "form" && fix.replacement === "from"),
    "TinyFix should load its local model and detect the known contextual typo",
  );
  console.log("Manifest, bundled assets, Persian suggestions, and TinyFix runtime passed.");
} finally {
  if (tinyfix) await tinyfix.dispose();
  await new Promise((resolveClose) => server.close(resolveClose));
}
