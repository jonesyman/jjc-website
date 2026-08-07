# Changelog

Notable application releases are recorded here. Git history remains the detailed source for individual fixes.

## 2026.08.06.01 — 2026-08-06

- Added a one-page Individual Working Genius Results roster between the Team Map and Team Map Analysis pages.
- The roster lists every participant's two Geniuses, two Competencies, and two Frustrations, and automatically adjusts row density or uses two table columns for larger teams.
- Added the W, I, D, G, E, and T letter badges beside the full Genius names on the primary Team Map.
- Included the new roster page in automatically generated Post-Session Package assessment PDFs.

## 2026.08.03.01 — 2026-08-03

- Added Delete Package to Post-Session Package History.
- Deleted package ZIPs move to Google Drive Trash and disappear from active history.
- Added a Recently Deleted Packages section with recovery through Restore Package.

## 2026.08.02.01 — 2026-08-02

- Added an Edit Name action to individual assessment records in Assessments & Groups.
- Name corrections now synchronize the canonical person, every linked workshop result, and cached leader names without changing assessment selections, memberships, or leader assignments.
- Added duplicate protection and an `AssessmentPersonHistory` audit trail for previous and corrected names.

## 2026.08.01.06 — 2026-08-01

- Suppressed obsolete Google Docs permission errors saved by package attempts made before client-side README generation was introduced.
- Current package-processing and actionable failure records remain visible in Package History.

## 2026.08.01.05 — 2026-08-01

- Post-Session Packages now wait for the saved assessment-group library before rendering workshop associations.
- Custom README PDFs are generated in the browser and uploaded with the package, removing the Google Docs creation-permission requirement.
- Package-generation errors remain visible in the builder until the next attempt, making full error details readable and recoverable.

## 2026.08.01.04 — 2026-08-01

- Batched generated assessment-PDF confirmation to eliminate repeated Drive waits during package creation.
- Added durable server-side operation status so the package builder reports the actual upload or ZIP error instead of a generic confirmation timeout.
- Added visible generation stages, longer Drive finalization handling, and a Refresh Package History action that surfaces processing and failed operations.

## 2026.08.01.03 — 2026-08-01

- Post-session packages now generate the current workshop and associated-group Assessment Results PDFs automatically from saved assessment data.
- Added an Associate with Workshop action to every saved group while retaining association management in the package builder.
- Removed the unnecessary manual assessment-PDF upload controls and standardized generated workshop/group filenames inside each ZIP.

## 2026.08.01.02 — 2026-08-01

- Constrained Post-Session Resource descriptions to three wrapped lines inside each selection card, with the complete description available on hover.
- Replaced the JJP 3D Printing sidebar's paper-printer emoji with a dedicated 3D-printer line icon.

## 2026.08.01.01 — 2026-08-01

- Added a reusable Post-Session Resource Library with individual-file and ZIP import support.
- Added workshop-based and standalone/historical resource-package builders.
- Workshops can retain associations with saved assessment groups for future packages.
- Presentation PDFs and exact overall/subgroup Assessment Results PDFs can be uploaded once and reused until replaced.
- Generated ZIP packages include organized presentation, Team Map Assessment, and selected resource folders.
- Added a customized `00 - READ ME FIRST.pdf` describing the package contents and suggested next steps.
- Added Google Drive package history with links to previously generated ZIP files.

## 2026.07.29.04 — 2026-07-29

- Added Sector, Industry, and Team Function classifications to client records.
- Workshops inherit missing classification values from their selected client.
- Analytics classification filters now generate their own square benchmark and selected-versus-benchmark radar charts alongside the overall, selected, and overall-comparison graphics.
- Workshop and saved-group analytics can inherit benchmark classifications from their linked client.

## 2026.07.29.03 — 2026-07-29

- Expanded the reusable Industry and Team Function suggestions to cover the current consulting workshop portfolio.
- Added standardized choices for community development, child and family services, higher education consulting, K–12 enrichment, and specialized higher-education teams.

## 2026.07.29.02 — 2026-07-29

- Added reusable Sector, Industry, and Team Function classifications to workshops and saved assessment groups.
- Added a Needs Classification workshop filter and visible classification status to simplify historical backfilling.
- Added square downloadable sector, industry, and team-function benchmark and comparison radar charts for selected workshops and groups.
- Benchmarks count each reusable assessment person once and flag samples below 10 people as limited.
- Added Sector, Industry, and Team Function filters to Assessment Analytics.

## 2026.07.29.01 — 2026-07-29

- Reduced the generated Team Map PDF from three pages to two by removing the condensed-map page.
- Added Responsive and Disruptive column headers plus Ideation, Activation, and Implementation row labels to the full-size Team Map on page 1.
- Preserved the standalone square condensed Team Map PNG download for presentation slides.

## 2026.07.26.02 — 2026-07-26

- Added Organization and Individual client types for one-on-one debrief engagements.
- Individual clients now use the person’s name throughout client lookups, estimates, invoices, and related records without requiring an organization.
- Documented that Team Map Analysis settings are initialized as persistent spreadsheet rows when first loaded.

## 2026.07.26.01 — 2026-07-26

- Consolidated the Consulting database, generated documents, and assets beneath one permanent Drive workspace.
- Anchored PDF generation to permanent Drive folder IDs so renames cannot create duplicate document folders.
- Added spreadsheet menu actions to open, audit, and safely repair the Consulting Drive organization.
- Added an archive location for prior folders and test PDFs without deleting them.

## 2026.07.25.11 — 2026-07-25

- Moved only the Discernment and Enablement labels and their annotations downward to add separation from the radar graph.
- Preserved the position of the other four Genius labels.

## 2026.07.25.10 — 2026-07-25

- Added dedicated inward offsets for the Discernment and Enablement labels on all three Genius-distribution graphics.
- Moved the Wonder label and its percentage/difference annotation upward for better spacing.

## 2026.07.25.09 — 2026-07-25

- Pulled the six radar-chart labels inward so Enablement, Discernment, and the other axis labels remain fully inside downloaded PNGs.
- Added signed percentage-point differences for every Genius on the comparison graphic, calculated as selected workshop/group minus the overall portal distribution.

## 2026.07.25.08 — 2026-07-25

- Added square six-axis Genius-distribution graphics to Assessment Analytics.
- Shows one blue overall-portal graphic by default and, when a workshop or saved group is selected, adds an orange selected-group graphic and a blue/orange overlay.
- Added saved-group analytics filtering and individual PNG downloads with context-aware filenames for all three graphics.
- Kept the chart layout responsive across desktop and mobile.

## 2026.07.25.07 — 2026-07-25

- Added unanimous yellow Competency highlighting for Responsive and Disruptive when all three associated types are yellow.
- Restored centered Genius and Frustration subheaders in downloaded condensed Team Maps after drawing the left-aligned type names.

## 2026.07.25.06 — 2026-07-25

- Changed Responsive and Disruptive suggestions to require unanimous highlights across all three associated Working Genius types.
- An orientation is now green only when all three member types are green, or red only when all three are red.
- Mixed colors, yellow highlights, and incomplete type highlighting no longer produce an orientation highlight.

## 2026.07.25.05 — 2026-07-25

- Corrected facilitator-note type distributions so Genius, Competency, and Frustration use one normalized denominator and total exactly 100%.
- Prevented absent or low Frustration from generating a red suggested highlight; red is now reserved for high Frustration.
- Added regression coverage for leader-weighted distributions and zero-Frustration Tenacity.

## 2026.07.25.04 — 2026-07-25

- Centered each condensed Team Map letter badge and Working Genius name as one measured header group.
- Prevented longer group-map headers, including Discernment, Galvanizing, and Enablement, from overlapping their letter badges.
- Kept workshop and saved-group condensed PNG downloads on the same consistent header layout.

## 2026.07.25.03 — 2026-07-25

- Reworked JJP quoting into a private production-cost calculator with a configurable suggested markup, desired-price override, implied adjustment, per-item price, margin, and cost-coverage guidance.
- Simplified customer PDFs to one polished line containing the public description, quantity, unit price, and amount while retaining all production details privately.
- Moved order quantity into a prominent centered PDF treatment and limited the Project block to the project name.
- Corrected Bill To ordering so the address precedes the phone number.
- Strengthened automatic PDF logo loading by caching the public GitHub asset in the private JJP Drive folder and using that Drive file for documents.
- Set deliberate customer-table column widths and removed the overflowing footer so sparse quotes remain on one page.

## 2026.07.25.02 — 2026-07-25

- Expanded JJP projects with notes, model links, design-file references, and client sketch/image uploads.
- Changed the filament library to one brand, product line, and material record with a reusable color list; seeded the 30 current Bambu Lab PLA Basic colors.
- Added structured filament and additional-cost selectors to quotes and invoices, including multi-color usage details and compact PDF filament subtotals.
- Added per-item mass-production quoting that multiplies filament, machine time, post-processing, and additional costs by the production quantity.
- Set the standard machine wear rate to $2 per hour and fixed filament amounts to be stored and displayed as grams.
- Added the JJP logo to generated quotes and invoices automatically, with an optional private Drive logo override.
- Removed the internal Consulting-organization reminder from the JJP Settings screen.

## 2026.07.25.01 — 2026-07-25

- Added a separate green, mobile-friendly Jeff Jones Prints admin console.
- Added JJP clients, projects, filament and additional-cost libraries, quotes, invoices, settings, and dashboard workflows.
- Added an independent JJP Apps Script backend and Google Sheet schema with stable numbering and quote-to-invoice conversion.
- Added branded quote and invoice PDF generation into separate JJP Drive folders.
- Recovered and reused the JJP layered-filament logo from the Android app.
- Linked the Consulting and JJP consoles without mixing their data.
- Recorded Consulting database and Drive organization cleanup as a separate post-JJP task.

## 2026.07.22.03 — 2026-07-22

- Changed stage recommendations to highlight only the single strongest overrepresented Genius or Frustration concentration across all three stages.
- Removed underrepresentation-based stage highlights.
- Reserved Responsive/Disruptive highlights for unusually dominant concentrations, preventing LVCC's 52/48 Genius and 30/70 Frustration split from being unnecessarily highlighted.

## 2026.07.22.02 — 2026-07-22

- Limited facilitator recommendations to the single most prominent highlight for each Working Genius type, stage of work, and Responsive/Disruptive orientation.
- Grouped suggested highlights into Working Geniuses, Stages of Work, and Responsive/Disruptive sections with the concise `Type: outline Area in Color` wording.
- Moved percentages into the six detailed Working Genius notes and made all type, stage, and orientation labels prominent with bracketed uppercase callouts.

## 2026.07.22.01 — 2026-07-22

- Added copy-ready Team Map slide notes for workshops and saved groups, including explicit highlight recommendations, W/I/D/G/E/T facilitator prompts, all three stages of work, and Responsive/Disruptive balance.
- Added standalone high-resolution square PNG downloads of the condensed Team Map, named from the workshop or group.
- Added Slide Notes and Download Map actions beside workshop assessment controls and on every saved-group card.
- Added contextual browser print/save names, including workshop assessment PDFs, group Team Maps, estimates, and invoices.
- Slightly increased the Team Map Analysis page font weight without changing its three-page PDF structure.

## 2026.07.20.08 — 2026-07-20

- Removed the Methodology block from the generated Team Map Analysis page so the PDF ends after Discussion Questions and remains a three-page document.

## 2026.07.20.07 — 2026-07-20

- Removed the four redundant summary boxes from the Team Map Analysis page.
- Simplified and restyled the distribution table to show only Working Genius Type and actual Genius, Competency, and Frustration count/percentage distributions.
- Removed the weighted and classification columns while retaining leader identification in the header.
- Corrected the Analysis page's printed box sizing to keep Discussion Questions on the same letter-size page.

## 2026.07.20.06 — 2026-07-20

- Set page-one Team Map name lists to flow into column two after 11 names.
- Set condensed Team Map name lists to flow into column two after 9 names.
- Retained the existing font sizes, weights, and overflow-based shrinking behavior.

## 2026.07.20.05 — 2026-07-20

- Restored PDF generation and browser print/save from the Team Map preview, including unsaved consultant edits currently visible in the preview.
- Recast Key Team Observations as six cards in W/I, D/G, E/T Team Map order.
- Changed Consultant Analysis to a concise prose list with explicit Genius references, clearer contribution/exploration language, and no redundant Leader Influence or Recommendations fields.
- Retained Discussion Questions as the dedicated facilitated-conversation prompts.

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
