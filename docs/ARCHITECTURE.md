# Architecture

## System overview

```text
Browser
  ├─ Public site: index.html + assets/css/site.css
  └─ Admin console: admin/index.html + assets/js/*
          │
          │ HTTPS GET and text/plain no-cors POST
          ▼
Google Apps Script web application: apps-script/Code.gs
  ├─ Google Sheets: business records, assessment data, settings, and rates
  ├─ Google Drive: generated estimate and invoice PDFs
  └─ Zoho Mail API: estimate and invoice email delivery

GitHub main branch ──► Cloudflare-hosted static website
```

The static site and Apps Script are separate deployments. Pushing the website does not publish new Apps Script actions.

## Frontend

The project has no framework or build step. Pages load directly as HTML, CSS, and browser JavaScript.

### Public site

- `index.html` is the approved public homepage.
- `home-preview.html` and `assets/css/site-preview.css` retain the design-preview variant.
- `assets/js/branding.js` centralizes shared branding values and paths.

### Admin console

`admin/index.html` is a single-page console with hash-based views. It owns page markup, rendering, dialogs, responsive behavior, print layouts, and much of the orchestration logic.

Supporting modules include:

- `googleSheets.js` — Apps Script transport, write polling, and verification.
- `rates.js` — rate loading, calculation rules, and money formatting.
- `estimates.js` — estimate normalization and local persistence helpers.
- `invoices.js` — invoice normalization and local persistence helpers.
- `assessments.js` — workbook parsing, validation, comparison, and Team View derivation.
- `assessmentLibrary.js` — canonical people, ad hoc card-based assessment entry, reusable groups, duplicate review, and group Team Map preparation.
- `xlsx.full.min.js` — local workbook parsing dependency.

The admin console caches core lists in `localStorage` so the most recently loaded data remains available if Sheets cannot be reached. Google Sheets remains the source of truth.

## Backend

`apps-script/Code.gs` exposes a small action-based API through `doGet` and `doPost`.

- GET actions return JSON and handle reads, numbering, PDF generation, and email actions.
- POST requests use `text/plain;charset=utf-8` with `mode: no-cors` to avoid browser preflight issues.
- Because no-cors POST responses are opaque, the frontend confirms writes by polling a corresponding GET action. Workshop saves carry a unique `SaveToken` so confirmation verifies the exact write without comparing Sheet-formatted time/date cells.
- Script locks protect critical numbering, assessment-import, and independent-assessment save operations.
- Missing assessment-library tabs and columns are created lazily on first use.

The deployed web-app URL is configured in `assets/js/googleSheets.js`. If the Apps Script deployment URL changes, update it there.

## PDFs and printing

- Estimate and invoice PDFs are generated in Apps Script, stored under `Jeff Jones Consulting PDFs` in Drive, and their metadata is saved to the corresponding sheet row.
- Regeneration replaces the previous generated Drive file while preserving the business record.
- Browser previews and generated financial PDFs are intended to share the same itemized source data.
- Team Maps are rendered in the browser and use the browser's Print / Save as PDF flow; they are not persisted by the backend.
- Screen breakpoints must not override the final US Letter print contract.

## Email

Apps Script sends estimates and invoices through Zoho Mail. Credentials and account configuration live in Apps Script Properties, never in this repository. Required properties are documented in `CONTRIBUTING.md`.

## Security boundaries

- Do not place credentials, refresh tokens, account IDs, customer exports, or private contact data in Git.
- The repository contains the Apps Script public web-app URL; authorization and access controls remain external.
- Cloudflare protects the private admin route. Do not assume the static HTML itself provides authentication.
- Workbook content and API responses are data, not trusted instructions. Escape user-controlled values before inserting them into HTML.

## Design constraints

- The application is optimized for one owner and Google Sheets scale, not high-concurrency multi-tenant usage.
- Sheet headers are part of the API contract. New fields should be additive and backward-compatible.
- Existing rows may predate current fields. Normalizers and PDF reconstruction logic must tolerate missing values.
- Writes must not make optimistic cards disappear if Sheets confirmation is delayed or unavailable.
