# Current State and Handoff

Last updated: 2026-07-14

## Repository state

- Primary branch: `main`
- Remote: `origin` (`jonesyman/jjc-website`)
- Current application version: `2026.07.13.03`
- Latest feature commit at the time of this handoff: `236dae7` — Add assessment library and reusable groups

Always run `git status`, `git branch --show-current`, and a short `git log` before starting. Do not assume the working tree is clean or that the local branch has already been pushed.

## What was just completed

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
