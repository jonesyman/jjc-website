# Changelog

Notable application releases are recorded here. Git history remains the detailed source for individual fixes.

## 2026.07.20.04 — 2026-07-20

- Adjusted page-one names to a 13px starting size and condensed-page names to 9.5px while retaining the stronger 600 weight.
- Replaced the fixed 12-row assumption with measured per-page capacity based on each box's actual visible height.
- Preserved first-column-first flow without evenly balancing names across columns.
- Added vertical and horizontal clipping detection so font fitting protects both the bottom and right edges.

## 2026.07.20.03 — 2026-07-20

- Fixed Team Map name fitting being measured while the PDF preview was hidden, which incorrectly split small groups and reduced their font size.
- Increased page-one names to a 16px starting size and page-two names to 12.5px.
- Increased all Team Map name weight to 600 for stronger physical printouts and clearer visual grouping.
- Changed dense areas to fill 12 names in the first column before placing names 13–24 in the second column.
- Delayed font reduction until a grouping exceeds the two-column capacity of 24 names.

## 2026.07.20.02 — 2026-07-20

- Added a responsive global loading status for desktop and mobile with live step names, determinate startup progress, and accessible status announcements.
- Added learned time-remaining estimates for Google Sheets requests based on recent completion times, with honest indeterminate messaging until an estimate is available.
- Parallelized the six independent startup data requests instead of loading core records, settings, and rates sequentially.
- Extended the status indicator to lazy-loaded views, refresh actions, PDF generation, email actions, and button-based saves through the shared data and save layers.
- Removed full backend response logging from routine reads to reduce browser work and avoid exposing large datasets in the console.

## 2026.07.20.01 — 2026-07-20

- Matched page one's name ordering and balanced two-column behavior to the condensed page-two Team Map.
- Retained page one's larger 15px starting font and taller panels as the only name-layout differences.
- Removed the page-one-only first-column-capacity calculation introduced in the previous release.

## 2026.07.19.05 — 2026-07-19

- Increased page-one Team Map names to a 15px starting size.
- Separated page-one name flow from the condensed page-two balancing behavior.
- Made page one fill its first name column vertically before opening a second column only when needed.
- Preserved page two's compact, balanced two-column handling for dense areas.

## 2026.07.19.04 — 2026-07-19

- Added an automated, branded Team Map Analysis page after the two existing Team Map pages without changing their layouts.
- Added centralized Genius, Competency, Frustration, leader-weighting, validation, classification, observation-priority, and consultant-question logic.
- Added editable consultant analysis, automatic suggestions, manual-edit protection, stale-data warnings, and Google Sheets persistence.
- Added configurable analysis thresholds and content controls with seeded defaults and restore-default behavior.
- Blocked analysis saves and PDF generation for invalid participant placements, and blocked outdated analysis from being printed.
- Added 17 automated scenario tests covering validation, distributions, weighting, classification, limits, questions, and cautious language.

## 2026.07.19.03 — 2026-07-19

- Fixed Team Map previews opened from Assessment Results being hidden behind the assessment dialog on mobile.
- Raised printable previews above all application dialogs and locked background scrolling while the Team Map is open.
- Added touch-friendly two-axis preview scrolling, a viewport-width sticky toolbar, and consistent letter-size pages on mobile.
- Preserved close-button focus return and exposed the preview's open/closed state to assistive technology.

## 2026.07.19.02 — 2026-07-19

- Simplified the condensed Team Map column headings to Responsive and Disruptive.
- Removed the workshop ID and redundant axis explanations from the condensed second page.
- Preserved the date, stage labels, square presentation format, and adaptive two-column name layout.

## 2026.07.19.01 — 2026-07-19

- Preserved the original Team Map as PDF page one and added a square, presentation-friendly page two.
- Added Responsive/Disruptive column labels and Ideation/Activation/Implementation stage labels to page two.
- Rendered crowded Genius and Frustration lists in two balanced columns on both PDF pages before reducing the shared name size.
- Ensured weighted leader entries and all other names remain visible in dense Team Map areas.

## 2026.07.16.02 — 2026-07-16

- Added a protected Email Templates admin area backed by a new `EmailTemplates` Google Sheet.
- Added create, edit, duplicate, archive, restore, permanent-delete, search, category, sort, preview, and clipboard workflows.
- Seeded three editable Working Genius assessment messages exactly once with backend-generated stable IDs.
- Added optional plain-text placeholders, unresolved-value warnings, editable previews, and clipboard fallback behavior.
- Added workshop-level template use with available client, contact, schedule, participant, location, and leader details prefilled.
- Added unsaved-change safeguards, accessible dialog focus handling, live status messages, and responsive portrait/landscape layouts.
- Kept template use copy-only; the library never sends messages directly.

## 2026.07.16.01 — 2026-07-16

- Constrained the long People & Assessments results to a responsive internal scrolling pane.
- Made the Saved Groups summary card open and focus group management.
- Distinguished active groups from recently deleted groups in the summary count.
- Kept Recently Deleted Groups visible even when empty and added an explicit Refresh Groups action.
- Verified the deployed recovery path and restored the Family group with its previous membership.

## 2026.07.15.03 — 2026-07-15

- Increased graphical Team Map name text from a 10.5px default to a uniform 13px starting size.
- Added automatic whole-map font fitting that reduces every name together only when at least one Genius or Frustration list would overflow its panel.
- Left empty Team Map Genius and Frustration areas blank instead of displaying “No participants.”
- Added a prominent saved-group manager with Load Group, Create Team Map, and Delete Group actions.
- Made saved-group names clickable and clarified the load-to-edit workflow in the saved cards and in-app tutorial.
- Added Recently Deleted Groups with restoration of the group and its last active membership set.

## 2026.07.15.02 — 2026-07-15

- Made group maintenance actions explicit on desktop and mobile, including Manage Group and Delete Group.
- Added Save & Create Team Map so a compiled group can move directly into its Team Map preview.
- Added workshop roster building from existing canonical people without duplicating their assessments.
- Added an in-workshop path for entering a new individual result and immediately adding it to the workshop roster.
- Added verified Google Sheets persistence for group saves, group deletion, and workshop roster additions.
- Recorded workshop-result notes as a separate planned phase rather than coupling them to roster management.

## 2026.07.15.01 — 2026-07-15

- Made all six individual Genius cards and all 15 Genius pairing cards clickable.
- Added a filter-aware drill-down dialog whose names come from the same deduplicated rows as each visible count.
- Added organization, workshop, date, pairing, independent-assessment, and active-filter context to drill-down results.
- Added zero-count empty states, keyboard focus management, Escape handling, focus trapping, and focus return.
- Verified desktop, 375px phone, and 768px tablet behavior without changing analytics counts, percentages, filters, or data sources.

## 2026.07.14.03 — 2026-07-14

- Removed the eight-participant cap from assessment workbook previews.
- Made the complete pre-import participant roster available in a bounded scrolling area.
- Kept the assessment dialog within the viewport on desktop, portrait mobile, and landscape mobile.
- Added keyboard focus and instructions to the complete participant review list.

## 2026.07.14.02 — 2026-07-14

- Added count and percentage cards for all 15 Working Genius pairings.
- Treated reversed Genius order, such as WI and IW, as the same pairing.
- Made pairing metrics respond to every Assessment Analytics filter.
- Fixed workshop save confirmation so Sheet-formatted time and date values no longer block the visible page refresh.
- Added an exact per-save token to confirm each workshop write safely.

## 2026.07.14.01 — 2026-07-14

- Added ad hoc individual assessment entry in People & Assessments.
- Added drag-and-drop and tap-based assignment of all six Working Genius cards.
- Added soft amber Competency styling alongside green Genius and red Frustration styling.
- Included independent assessments in Assessment Analytics without inventing workshop records.
- Preserved canonical matching and possible-duplicate review for ad hoc entries.

## 2026.07.13.03 — 2026-07-13

- Added the canonical People & Assessments library.
- Added reusable groups assembled from people, workshop rosters, or saved groups.
- Added group-specific leaders and Team Map previews.
- Added possible-duplicate review and merge decisions.
- Updated analytics to count canonical people once in the filtered view.
- Added optional workshop dates and descriptive historical timeframes.
- Expanded Tutorial & Best Practices for reusable groups.

## 2026.07.13.02 — 2026-07-13

- Reordered the admin navigation to follow the consulting workflow.

## 2026.07.13.01 — 2026-07-13

- Preserved invoice client identity and saved-card labels during PDF regeneration.
- Restored the client name in generated invoices while retaining client email.

## 2026.07.12.26 — 2026-07-12

- Unified estimate discounts, previews, printing, and generated PDF itemization.
- Reconstructed missing itemization for legacy estimates and linked invoices.
- Aligned generated invoice PDFs with itemized previews.

## 2026.07.12.25 — 2026-07-12

- Applied the approved Working Genius-inspired design to the public homepage.
- Reduced hover movement on informational cards.
- Fixed public mobile stacking.

## 2026.07.12.23 — 2026-07-12

- Refreshed the private admin visual design with the dark-blue palette and restrained motion.
- Linked estimates to saved clients and improved save verification.

## 2026.07.12.22 — 2026-07-12

- Generalized distinct mobile landscape layouts across the admin application.

## 2026.07.12.21 — 2026-07-12

- Completed mobile assessment dialogs, Team Map preview behavior, and production polish.
- Refined mobile forms, filters, lists, action menus, and workshop orientations.

## 2026.07.12.14 — 2026-07-12

- Added the Assessment Analytics dashboard with Genius distribution and filters.

## 2026.07.12.13 — 2026-07-12

- Completed assessment management, import history, and removal tools.

## 2026.07.12.11 — 2026-07-12

- Added printable Team Maps and refined their layout, role colors, and leader treatment.

## 2026.07.12.6 — 2026-07-12

- Added the assessment import foundation, workbook validation, Team View, and merge/replace workflows.

## 2026.07.11.1 — 2026-07-11

- Added workshop management and began the modern operational admin workflow.

## Earlier foundation

- Established the public website, private admin console, Google Sheets integration, verified writes, record numbering, Drive PDF generation, Zoho delivery, client details, archives, safeguards, dashboard metrics, financial lifecycle management, and settings/rates.
