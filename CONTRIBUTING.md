# Contributing

## Before changing anything

1. Read `README.md`, `docs/PROJECT_CONTEXT.md`, `docs/CURRENT_STATE.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, and `docs/ROADMAP.md`.
2. Inspect `git status`, the active branch, recent commits, and `origin/main`.
3. Preserve unrelated user changes in a dirty working tree.
4. Confirm whether the requested change affects only the static site, Apps Script, or both deployments.

## Development principles

- Every change to `admin/index.html` or admin-facing JavaScript/CSS must include a documentation update in the same change set. At minimum, update `docs/CURRENT_STATE.md`; update `CHANGELOG.md` for user-visible behavior, and update the architecture, data model, project context, or roadmap whenever that subject is affected.
- Keep the interface understandable to a non-technical owner.
- Prefer additive, backward-compatible sheet changes.
- Preserve historical data and stable record IDs.
- Never allocate a numbered business ID merely by opening or refreshing a form.
- Continue polling to verify no-cors writes before treating them as durable.
- Escape untrusted text before inserting it into HTML.
- Never commit credentials, tokens, private exports, or real customer data.
- Keep financial preview, print, and generated-PDF itemization aligned.
- Keep Team Map generation local unless explicitly changed.

## Application version

Every application release must update both version references in `admin/index.html`:

1. The visible sidebar label.
2. `const APP_VERSION`.

Use the existing `YYYY.MM.DD.NN` pattern and add a matching entry to `CHANGELOG.md`.

## Testing checklist

Run checks proportional to the change. At minimum:

- Parse all modified JavaScript and inline scripts for syntax errors.
- Run `git diff --check`.
- Verify every new `getElementById` dependency exists in the markup.
- Load the affected admin view in a browser.
- Check browser console errors separately from expected errors caused by an older deployed Apps Script.
- Test mobile portrait around `412 × 915` CSS pixels.
- Test mobile landscape around `915 × 412` CSS pixels.
- Confirm there is no page-level horizontal overflow.
- Check that compact mobile filters and expandable action menus remain usable.
- For print changes, inspect US Letter output and ensure mobile media queries do not alter it.
- For estimate/invoice changes, compare calculator preview, saved-card preview, browser print, and generated Drive PDF.
- For assessment changes, verify upload, validation, merge/replace, leader selection, Team View, Team Map, analytics, and group membership as applicable.

## Google Apps Script deployment

When `apps-script/Code.gs` or `appsscript.json` changes:

1. Update the Apps Script project.
2. Create a new web-app deployment version; editing code alone does not update the existing deployment.
3. Preserve the configured execution/access settings.
4. Confirm the deployed URL. If it changes, update `Database.apiUrl` in `assets/js/googleSheets.js`.
5. Exercise at least one read and one write action.
6. Confirm Drive authorization if PDF scopes changed.
7. Confirm Zoho email only when the change touches email delivery.

Apps Script Properties used by Zoho include:

- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_REFRESH_TOKEN`
- `ZOHO_ACCOUNT_ID`
- `ZOHO_FROM_EMAIL`
- Optional regional overrides: `ZOHO_ACCOUNTS_URL`, `ZOHO_MAIL_API_URL`

Never place these values in source control.

## Static-site deployment

1. Commit focused changes with a descriptive message.
2. Push the intended branch to GitHub.
3. Confirm the remote branch contains the commit.
4. Allow Cloudflare to build/deploy from the configured branch.
5. If Cloudflare reports a deleted or rolled build token, update the token in Worker Builds settings and retry.
6. Verify the visible version and the affected workflow in production.

## Commit and handoff expectations

- A local commit is not a push. Always state which operation actually completed.
- After pushing, compare local HEAD with `origin/main` and report the pushed commit IDs.
- Update `docs/CURRENT_STATE.md` when deployment requirements, known issues, or the immediate next step change.
- Update `docs/DATA_MODEL.md` whenever a sheet, key, relationship, or identity rule changes.
- Update `docs/ARCHITECTURE.md` when integrations or deployment boundaries change.
- Update `docs/ROADMAP.md` when a milestone is completed or reprioritized.
