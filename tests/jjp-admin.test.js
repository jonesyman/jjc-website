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

test("expanded projects, filament colors, and production quantities are wired", () => {
  ["ModelLinks", "FileReferences", "Notes", "uploadProjectFile"].forEach(field => {
    assert.ok(admin.includes(field) || backend.includes(field));
  });
  ["Brand", "ProductLine", "MaterialType", "ColorsJson"].forEach(field => assert.ok(backend.includes(field)));
  assert.ok(backend.includes("Jade White (10100)"));
  assert.ok(backend.includes("Black (10101)"));
  assert.ok(admin.includes("ProductionQuantity"));
  assert.ok(backend.includes("ProductionQuantity"));
  assert.ok(backend.includes('DefaultMachineRate: ["2.00"'));
});

test("PDFs simplify customer pricing and load the JJP logo automatically", () => {
  assert.ok(backend.includes('["DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"]'));
  assert.ok(backend.includes("insertLogo_"));
  assert.ok(backend.includes("ensureLogoFile_"));
  assert.ok(backend.includes('parent.createFile(blob)'));
  assert.ok(backend.includes("raw.githubusercontent.com/jonesyman/jjc-website"));
  assert.ok(fs.readFileSync("apps-script-jjp/appsscript.json", "utf8").includes("script.external_request"));
});

test("private pricing workbench drives a sparse customer PDF", () => {
  ["PublicDescription", "PricingMarkupPercent", "RecommendedSubtotal", "TargetSubtotal", "PricingAdjustment"].forEach(field => {
    assert.ok(admin.includes(field) || backend.includes(field));
  });
  assert.ok(backend.includes('body.appendParagraph("ORDER QUANTITY")'));
  assert.ok(!backend.includes('project.Description || ""'));
  assert.ok(admin.includes("Estimated gross margin"));
  assert.ok(admin.includes("does not cover the calculated production cost"));
});

test("quotes and invoices use dynamic check payment information", () => {
  assert.ok(html.includes('name="ChecksPayableTo"'));
  assert.ok(backend.includes('ChecksPayableTo: ["Jeff Jones"'));
  assert.ok(backend.includes('"Checks payable to: " + payee'));
  assert.ok(backend.includes('settings.BusinessAddress'));
  assert.ok(backend.includes("appendPaymentInformation_(body, record.Type, settings)"));

  const paymentFunction = backend.match(/function paymentInformation_\(documentType, settings\) \{[\s\S]*?\n\}/)[0];
  const paymentInformation = new Function(`${paymentFunction}; return paymentInformation_;`)();
  ["QUOTE", "INVOICE"].forEach(type => {
    const output = paymentInformation(type, { ChecksPayableTo: "Jeff Jones", BusinessAddress: "123 Main St\nClovis, CA 93612" });
    assert.equal(output.visible, true, `${type} payment information should be visible`);
    assert.equal(output.payableLine, "Checks payable to: Jeff Jones");
    assert.equal(output.address, "123 Main St\nClovis, CA 93612");
  });
});

test("mobile navigation and JJP branding are present", () => {
  assert.match(html, /JJP_Logo\.png/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(fs.readFileSync("assets/css/jjp-admin.css", "utf8"), /@media\(max-width:720px\)/);
});
