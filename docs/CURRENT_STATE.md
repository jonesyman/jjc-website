# Current State and Handoff

Last updated: 2026-07-22

## Repository state

- Primary branch: `main`
- Remote: `origin` (`jonesyman/jjc-website`)
- Current application version: `2026.07.22.02`
- Latest feature: prioritized one-per-subject facilitator highlights

Always run `git status`, `git branch --show-current`, and a short `git log` before starting. Do not assume the working tree is clean or that the local branch has already been pushed.

## What was just completed

- Reduced facilitator highlighting to one strongest recommendation per Genius type, stage, and Responsive/Disruptive side, with separated highlight groups and no percentage clutter.
- Added percentages to the detailed W/I/D/G/E/T notes and strengthened all copied-note labels with bracketed uppercase callouts.

- Added workshop and saved-group Slide Notes with color-coded highlight instructions followed by W/I/D/G/E/T, stage-of-work, and Responsive/Disruptive facilitator prompts.
- Added high-resolution square PNG downloads of the condensed Team Map, with filenames based on the selected workshop or group.
- Added contextual filenames to browser print/save workflows and slightly increased Analysis-page font weight without changing the three-page PDF structure.

- Removed the Methodology block from the Analysis print page so the PDF ends after Discussion Questions and remains three pages.

- Removed the redundant Analysis summary boxes and reduced the distribution table to Type plus actual Genius, Competency, and Frustration counts and percentages.
- Restyled the table and corrected letter-page box sizing so Discussion Questions remain on the Analysis page when printed.

- Set page-one Team Map lists to flow after 11 names and condensed lists to flow after 9, without changing their typography or other PDF behavior.

- Restored Team Map PDF and browser print/save directly from the open preview, using the consultant analysis currently shown even when it has not yet been saved.
- Presented Key Team Observations in six W/I, D/G, E/T cards and Consultant Analysis as labeled prose with explicit Genius references.
- Removed the redundant Leader Influence and Recommendations analysis fields while preserving Discussion Questions.

- Tuned the thicker Team Map names to 13px on page one and 9.5px on the condensed page.
- Made each map measure its real row capacity before flowing to column two, then fit only as needed to prevent bottom or right-edge clipping.

- Corrected hidden-preview measurement so small Team Map groups no longer split or shrink incorrectly.
- Increased and thickened names on both Team Map graphics; lists now fill 12 rows before flowing to column two and only shrink beyond 24 names.

- Added one responsive loading status across the admin console with exact startup steps, percentage complete, background-operation labels, and learned time-remaining estimates.
- Parallelized clients, workshops, estimates, invoices, settings, and rates during startup, while retaining local-cache fallbacks for each dataset independently.
- Routed shared Google Sheets reads and button-based saves through the loading status so lazy views and long-running actions remain visible on desktop and mobile.

- Matched page one's name ordering and balanced two-column trigger to page two while retaining page one's 15px font and taller panels.

- Increased page-one Team Map names to 15px and made each list fill its first column before flowing into a second column only when required.
- Kept the condensed page-two layout independent, including its balanced handling of dense name lists.

- Added a third, branded Team Map Analysis page while preserving the existing first and second pages.
- Added validated actual and leader-weighted G/C/F distribution metrics, threshold-based classifications, prioritized cautious observations, and discussion questions.
- Added consultant-editable analysis with automatic suggestions, manual-field protection, saved/current status, and stale-source detection.
- Added Team Map Analysis settings with seeded defaults, help text, and restore-default behavior.
- Added `TeamMapAnalyses` persistence and post-write polling through the Apps Script backend.
- Added 17 automated engine scenarios plus complete-page load verification.

- Fixed mobile Team Map previews that opened behind the Assessment Results dialog by placing printable previews above every dialog layer.
- Added background-scroll locking, touch-friendly two-axis panning, a viewport-width sticky toolbar, and consistent page sizing while previewing Team Maps on mobile.
- Simplified the condensed map headings to Responsive and Disruptive and removed its workshop ID and redundant footer explanations.
- Preserved the existing Team Map as PDF page one and added a square second page for clean slide-deck screenshots.
- Labeled the page-two vertical Responsive/Disruptive split and horizontal Ideation/Activation/Implementation stages.
- Made crowded Genius and Frustration areas use two balanced name columns on both pages before any font reduction, preserving every weighted leader entry.

- Added Email Templates to the admin sidebar and Tutorial & Best Practices workflow.
- Added Google Sheets-backed template creation, editing, duplication, archive, restore, and confirmed permanent deletion.
- Added three once-only starter templates with stable backend-generated `EMT-` IDs.
- Added search, category filtering, sorting, live preview, optional placeholders, unresolved warnings, and subject/body clipboard actions.
- Added Use Email Template to workshop cards so available workshop and client context is prefilled without sending email.
- Added unsaved-change warnings, focus trapping/return, Escape close, live toast announcements, and mobile layouts.

- Constrained People & Assessments to a viewport-responsive scrolling pane instead of allowing all 185 people to lengthen the page.
- Made the Saved Groups summary actionable and separated its active and recently deleted counts.
- Made Recently Deleted Groups persistently visible with an empty state and Refresh Groups control.
- Verified the deployed recovery action and restored Family; the workspace now reports one active group with its previous one-member membership and zero deleted groups.
- Increased Team Map names to a uniform 13px starting size; crowded areas now split into two columns before layout-based fitting reduces the shared size.
- Removed “No participants” from empty graphical Team Map areas so those panels remain blank.
- Added a saved-group selector at the top of Group Builder with explicit Load Group, Create Team Map, and Delete Group actions.
- Made saved-group card titles clickable and renamed the card action to Load Group to Edit.
- Added Recently Deleted Groups so an accidentally deleted group and its last active membership set can be restored.
- Made Manage Group, Create Team Map, and Delete Group visible on each saved group, including mobile layouts.
- Added an edit-state Delete This Group control and a Save & Create Team Map path in the group builder.
- Added Add People to workshop assessment results, with searchable selection from the canonical assessment library and automatic exclusion of existing roster members.
- Added Enter New Individual Result from the workshop picker so a result is stored once canonically and then linked into the workshop.
- Added a manual workshop assessment-import record when a workshop has no workbook import, allowing leader selection, Team View, and Team Map generation.
- Added polling verification for group updates, group deletion, and workshop roster additions.
- Made every individual Genius and Genius pairing metric a mouse-, touch-, and keyboard-accessible button.
- Added a responsive analytics detail dialog using the exact filtered, deduplicated rows behind each card count.
- Added active-filter context, person details, reverse-order pairing support, clear zero-count results, focus trapping, Escape close, and focus return.
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

The release requires new Apps Script actions. If **Email Templates** displays `Unknown action: getEmailTemplates`, the static site is ahead of the deployed Apps Script. The earlier `getAssessmentWorkspace` warning remains applicable to assessment-library deployments.

Deployment order:

1. Update and deploy `apps-script/Code.gs` as a new Apps Script web-app version.
2. Confirm the deployment continues to use the URL configured in `assets/js/googleSheets.js`, or update that URL if it changed.
3. Push/deploy the static site through the normal GitHub/Cloudflare flow.
4. Open **Assessments & Groups** and allow the first-load backfill to create/link canonical records.
5. Open **Email Templates** once to create the `EmailTemplates` tab and its three starter rows.

Cloudflare may reject a build if its build token was deleted or rolled. In that case, update the token in Worker Builds settings and retry; the source commit itself is not the cause.

## First production checks

- Confirm `EmailTemplates` is created with the documented exact headers and three starter rows appear only once after repeated refreshes.
- Create, edit, duplicate, archive, restore, and permanently delete a disposable archived template; confirm each result persists after refresh.
- Open a template from a workshop, confirm available context is prefilled, enter any missing values, and verify unresolved placeholders are clearly reported.
- Copy subject, message, and both together; paste into a plain-text editor to verify paragraph spacing and line breaks.
- Confirm closing edited preview text and navigating away from an unsaved template each provides a warning.
- Test Email Templates and its preview in desktop, phone portrait, and phone landscape layouts.

- Confirm `AssessmentPeople`, `AssessmentGroups`, `AssessmentGroupMembers`, and `AssessmentDuplicateReviews` were created.
- Confirm `AssessmentResults` gained and populated `PersonID` without losing prior rows.
- Confirm workshop uploads still import, merge, replace, and select leaders normally.
- Confirm a person shared by multiple workshops appears once in the people library and analytics.
- Add an independent assessment, refresh the library, and confirm it appears in analytics without a workshop.
- Confirm card assignment works by drag on desktop and by tap in mobile portrait and landscape.
- Confirm all 15 pairing cards render, total to the filtered people count, and update with filters.
- Open every Genius card and representative pairing cards with no filters and combined filters; confirm each dialog name count equals its card count.
- Confirm a zero-count pairing opens its clear empty state and analytics drill-downs remain usable at 375px and 768px widths.
- Save a workshop containing start/end times and confirm the list refreshes immediately without reloading the page.
- Preview an assessment workbook with more than eight participants and scroll through the complete roster before importing.
- Review any possible duplicates before relying on unique-person totals.
- Build a custom group, set its leader, and print-preview its Team Map.
- Edit and delete a test group, then confirm both changes persist after refresh.
- Add existing people to a workshop with and without a prior workbook import; confirm duplicate roster members are excluded and the Team Map remains available.
- Enter a new individual from a workshop, confirm it appears once in the canonical library, and confirm it is linked to that workshop.
- Test the new area on mobile portrait and landscape.
- Confirm sparse Team Maps remain at 13px, dense maps fit on one US Letter page, and every displayed name uses the same font size.
- Load and delete a disposable saved group from both the manager selector and its saved-group card.

## Known design decisions

- Every future admin-facing change must include a corresponding documentation update in the same change set.
- Google Sheets remains the source of truth; localStorage is a cache/fallback.
- Assessment emails are unavailable and must not be required.
- Matching uses normalized names and assessment fingerprints.
- Historical workshop dates are optional.
- Saved groups copy person references and are not recursively nested.
- Team Maps remain local print/save artifacts.
- A workshop may use a workbook-backed import or a manually assembled roster of canonical people.
- Workshop-result notes are planned separately and are not part of version `2026.07.16.02`.
- Apps Script and the static website are separate deployments.

## Suggested opening instruction for a new Codex task

> Continue development of the Jeff Jones Consulting website in the current workspace. Before making changes, read README.md, CONTRIBUTING.md, CHANGELOG.md, and every file under docs/. Inspect Git status, the current branch, recent history, and the relationship between local HEAD and origin/main. Treat docs/CURRENT_STATE.md and docs/ROADMAP.md as the handoff, then summarize your understanding before proceeding.
