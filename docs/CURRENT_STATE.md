# Current State and Handoff

Last updated: 2026-07-14

## Repository state

- Primary branch: `main`
- Remote: `origin` (`jonesyman/jjc-website`)
- Current application version: `2026.07.14.03`
- Latest fix: complete, scrollable assessment import previews

Always run `git status`, `git branch --show-current`, and a short `git log` before starting. Do not assume the working tree is clean or that the local branch has already been pushed.

## What was just completed

- Removed the preview-only `slice(0, 8)` cap so every participant about to be imported is rendered.
- Added a bounded, keyboard-focusable participant preview scroller and viewport-safe assessment dialog overflow.
- Added all 15 named Genius pairing cards with count and percentage values that follow the current analytics filters.
- Made Genius pair order interchangeable, so combinations such as WI and IW share one result.
- Replaced workshop all-field save verification with an exact `SaveToken`, preventing Sheets time/date formatting from blocking the local refresh.
- Added **Add Individual** to People & Assessments for results received outside a workshop.
- Added drag-and-drop plus mobile-friendly tap assignment for the six cards, with exactly two required in each role.
- Added soft amber Competency styling in people, duplicate-review, and analytics cards.
- Included independent canonical people in Assessment Analytics while keeping workshop counts accurate.
- Added **Assessments & Groups** to the admin sidebar.
- Added a canonical one-assessment-per-person library.
- Added custom groups assembled from individuals, workshop rosters, or saved groups.
- Added group-specific leader selection and Team Map preview.
- Added possible-duplicate review for same-name conflicting assessments.
- Updated Assessment Analytics to count canonical people once within the filtered view.
- Added optional workshop dates and descriptive historical timeframes.
- Updated the in-app Tutorial and Best Practices workflow.
- Verified JavaScript syntax, DOM ID contracts, mobile portrait/landscape behavior, and no horizontal page overflow.

## Deployment status to verify

The feature requires new Apps Script actions. If **Assessments & Groups** displays `Unknown action: getAssessmentWorkspace`, the static site is ahead of the deployed Apps Script.

Deployment order:

1. Update and deploy `apps-script/Code.gs` as a new Apps Script web-app version.
2. Confirm the deployment continues to use the URL configured in `assets/js/googleSheets.js`, or update that URL if it changed.
3. Push/deploy the static site through the normal GitHub/Cloudflare flow.
4. Open **Assessments & Groups** and allow the first-load backfill to create/link canonical records.

Cloudflare may reject a build if its build token was deleted or rolled. In that case, update the token in Worker Builds settings and retry; the source commit itself is not the cause.

## First production checks

- Confirm `AssessmentPeople`, `AssessmentGroups`, `AssessmentGroupMembers`, and `AssessmentDuplicateReviews` were created.
- Confirm `AssessmentResults` gained and populated `PersonID` without losing prior rows.
- Confirm workshop uploads still import, merge, replace, and select leaders normally.
- Confirm a person shared by multiple workshops appears once in the people library and analytics.
- Add an independent assessment, refresh the library, and confirm it appears in analytics without a workshop.
- Confirm card assignment works by drag on desktop and by tap in mobile portrait and landscape.
- Confirm all 15 pairing cards render, total to the filtered people count, and update with filters.
- Save a workshop containing start/end times and confirm the list refreshes immediately without reloading the page.
- Preview an assessment workbook with more than eight participants and scroll through the complete roster before importing.
- Review any possible duplicates before relying on unique-person totals.
- Build a custom group, set its leader, and print-preview its Team Map.
- Test the new area on mobile portrait and landscape.

## Known design decisions

- Every future admin-facing change must include a corresponding documentation update in the same change set.
- Google Sheets remains the source of truth; localStorage is a cache/fallback.
- Assessment emails are unavailable and must not be required.
- Matching uses normalized names and assessment fingerprints.
- Historical workshop dates are optional.
- Saved groups copy person references and are not recursively nested.
- Team Maps remain local print/save artifacts.
- Apps Script and the static website are separate deployments.

## Suggested opening instruction for a new Codex task

> Continue development of the Jeff Jones Consulting website in the current workspace. Before making changes, read README.md, CONTRIBUTING.md, CHANGELOG.md, and every file under docs/. Inspect Git status, the current branch, recent history, and the relationship between local HEAD and origin/main. Treat docs/CURRENT_STATE.md and docs/ROADMAP.md as the handoff, then summarize your understanding before proceeding.
