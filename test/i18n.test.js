import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { LANGS, locName, setLang, t, teamName } from "../src/i18n.js";
import { TEAM, TEAM_NAME_ZH } from "../src/config.js";

test("繁中 nicknames are 小白 / 小金毛", () => {
  const prev = setLang("zh");
  try {
    assert.equal(TEAM_NAME_ZH[TEAM.MALTESE], "小白");
    assert.equal(TEAM_NAME_ZH[TEAM.RETRIEVER], "小金毛");
    assert.equal(teamName(TEAM.MALTESE), "小白");
    assert.equal(teamName(TEAM.RETRIEVER), "小金毛");
    assert.equal(t("kicker"), "小白 vs 小金毛");
    assert.equal(t("blurb").includes("馬爾濟斯"), false);
    assert.equal(t("blurb").includes("尋回犬"), false);
    assert.match(t("blurb"), /小白/);
    assert.match(t("blurb"), /小金毛/);
  } finally {
    setLang(prev);
  }
});

test("English UI keeps Maltese / Retriever", () => {
  const prev = setLang("en");
  try {
    assert.equal(teamName(TEAM.MALTESE), "Maltese");
    assert.equal(teamName(TEAM.RETRIEVER), "Retriever");
    assert.equal(t("how"), "How to play");
    assert.equal(locName("playground"), "Gym room");
  } finally {
    setLang(prev);
  }
});

test("language list is growable, not a two-way toggle", () => {
  assert.ok(LANGS.length >= 2);
  assert.deepEqual(LANGS.map((l) => l.id), ["zh", "en"]);
  const prev = setLang("zh");
  try {
    assert.equal(setLang("nope"), "zh");
    assert.equal(setLang("en"), "en");
    assert.equal(setLang("zh"), "zh");
  } finally {
    setLang(prev);
  }
});

test("title screen ships a language list and 小白 copy", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const i18n = readFileSync(new URL("../src/i18n.js", import.meta.url), "utf8");
  assert.match(html, /class="lang-row"/);
  assert.match(html, /data-lang="zh"/);
  assert.match(html, /data-lang="en"/);
  assert.match(html, /小白/);
  assert.match(html, /小金毛/);
  assert.equal(html.includes("馬爾濟斯"), false);
  assert.equal(html.includes("尋回犬"), false);
  assert.match(i18n, /export const LANGS/);
});
