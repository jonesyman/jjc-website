const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("admin/jjp.html", "utf8");
const admin = fs.readFileSync("assets/js/jjpAdmin.js", "utf8");
const api = fs.readFileSync("assets/js/jjpApi.js", "utf8");
const backend = fs.readFileSync("apps-script-jjp/Code.gs", "utf8");

test("JJP browser scripts parse", () => {
  new Function(api);
  new Function(admin);
});

test("JJP backend parses as JavaScript", () => {
  new Function(backend);
  assert.ok(!backend.includes('.setBackground("#dcefe4").setFrozenRows'));
  assert.ok(backend.includes("sheet.setFrozenRows(1)"));
});

test("every static byId dependency exists", () => {
  const ids = [...admin.matchAll(/byId\("([^"]+)"\)/g)].map(match => match[1]);
  const missing = [...new Set(ids)].filter(id => !html.includes(`id="${id}"`) && !admin.includes(`id="${id}"`));
  assert.deepEqual(missing, []);
});

test("JJP uses its independent Google resources", () => {
  assert.match(backend, /1awuRVwSa7hy4rAoC21fKvB1ctMNmZi82dwDhe6WTxYw/);
  assert.match(backend, /1Q2B7z4q-HZdVX-wEP9L5XchEUacurgxZ/);
  assert.match(api, /https:\/\/script\.google\.com\/macros\/s\/[^"]+\/exec/);
});

test("quote calculations and conversion are present", () => {
  ["FailureBufferPercent", "Discount", "TaxPercent", "Shipping", "GrandTotal"].forEach(field => assert.ok(admin.includes(field)));
  assert.ok(admin.includes("convertQuote"));
  assert.ok(backend.includes("convertQuote_"));
});

test("mobile navigation and JJP branding are present", () => {
  assert.match(html, /JJP_Logo\.png/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(fs.readFileSync("assets/css/jjp-admin.css", "utf8"), /@media\(max-width:720px\)/);
});
