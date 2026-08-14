import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("builds a static policy center shell", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /<title>赛优制度<\/title>/);
  assert.match(html, /<div id="root"><\/div>/);
  assert.doesNotMatch(html, /codex-preview|Building your site/i);
});

test("connects the page to DATA and keeps document rendering in the browser", async () => {
  const [page, pdfViewer, officeViewer, api, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/PdfViewer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/OfficeViewer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/policy-api.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /policyApi\.bootstrap\(\)/);
  assert.doesNotMatch(page, /new-employee-onboarding-7-28\.pdf/);
  assert.match(pdfViewer, /from "react-pdf"/);
  assert.match(officeViewer, /from "docx-preview"/);
  assert.match(officeViewer, /from "@js-preview\/excel"/);
  assert.match(api, /\/api\/policy-center\/bootstrap/);
  assert.match(packageJson, /"node": ">=18\.0\.0"/);
});

test("locks preview scrolling and hides empty sections outside admin mode", async () => {
  const [page, styles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /document\.body\.style\.overflow = "hidden"/);
  assert.match(page, /adminMode \? sections : sections\.filter\(\(section\) => section\.documents\.length > 0\)/);
  assert.match(page, /\{displaySections\.map\(\(section\) =>/);
  assert.match(styles, /overscroll-behavior: none/);
  assert.match(styles, /overscroll-behavior: contain/);
});
