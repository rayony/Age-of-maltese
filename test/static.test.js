import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const pages = readFileSync(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");
const ci = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");

describe("static site + pipelines", () => {
  it("title screen carries the slogan and 3-minute clock", () => {
    assert.match(html, /Harvest, Build, Attack!/);
    assert.match(html, /03:00/);
    assert.match(html, /data-act="tower"/);
    assert.match(html, /單位/);
    assert.match(html, /建築/);
    assert.match(html, /Paused/);
  });

  it("layout has a right dock and closeable inspect panel", () => {
    assert.match(css, /\.dock/);
    assert.match(html, /id="inspectClose"/);
    assert.match(html, /id="clockBtn"/);
  });

  it("CI runs on pull requests and CD deploys only after tests", () => {
    assert.match(ci, /pull_request:/);
    assert.match(pages, /needs: test/);
    assert.match(pages, /path: _site/);
  });
});
