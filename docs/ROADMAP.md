# Roadmap

This roadmap records product capabilities rather than relying solely on historical phase numbers. Git history is authoritative for the exact implementation sequence.

## Completed foundations

- Public consulting website and shared branding.
- Private single-page admin console.
- Google Sheets data access with post-write verification.
- Settings and rate loading.
- Client management and client-linked records.
- Estimates with discounts, itemized previews, generated PDFs, and email delivery.
- Workshops with status, contacts, financial links, archive workflows, and optional historical dates.
- Invoices with itemized previews/PDFs, payment lifecycle, client preservation, and email delivery.
- Dashboard metrics and client detail views.
- Record numbering allocated only during actual saves.
- Assessment workbook validation, preview, import, merge, replace, history, and removal.
- Team View, leader weighting, and printable local Team Maps.
- Assessment Analytics with filter-responsive individual Genius counts, all 15 named pairings, and unique-person totals.
- Tutorial and Best Practices page.
- Dark Working Genius-inspired visual refresh.
- Mobile portrait/landscape layouts, compact filters, and expandable record actions.
- Canonical assessment people, reusable groups, duplicate review, and group Team Maps.
- Ad hoc individual assessment entry with drag/tap card assignment and analytics inclusion.
- Exact-token workshop save confirmation that refreshes the visible list after Sheets persistence.
- Complete scrollable assessment-import previews without a participant display cap.
- Filter-aware, accessible name drill-downs for all individual Genius and pairing analytics cards.
- Explicit group maintenance and deletion with a direct Save & Create Team Map workflow.
- Workshop rosters assembled or extended from canonical people, including new ad hoc individual entry.
- Two-page Team Maps with a square annotated presentation layout, adaptive two-column name areas, and blank empty areas.
- A prominent saved-group manager for loading, mapping, and deleting groups.
- Recoverable group deletion with restoration of the most recently active membership set.
- A compact, internally scrolling people library and actionable active/deleted group summary.
- A Google Sheets-backed plain-text Email Template Library with once-only starter content, workshop personalization, preview, clipboard copying, and full archive lifecycle.
- Automated Team Map Analysis with validated actual/weighted distributions, configurable diagnostics, consultant editing, persistence, and print safeguards.

## Current release boundary

Version `2026.07.19.05` gives page one a larger, first-column-first name flow while preserving the condensed page-two layout and automated analysis pages. The Team Map remains a browser-generated local print/save artifact.

See `CURRENT_STATE.md` before continuing.

## Recommended next work

### Immediate validation

- Deploy the Apps Script update, open Email Templates, and confirm the sheet and three starter rows are created exactly once.
- Exercise the complete template lifecycle and confirm every no-cors write through a refreshed read.
- Verify workshop-prefilled personalization, unresolved-value warnings, plain-text clipboard output, and desktop/portrait/landscape layouts.

- Deploy Apps Script and allow the first assessment-library backfill to complete.
- Confirm the created sheet tabs and `PersonID` links.
- Review possible duplicate names before building production groups.
- Create a real custom group from a workshop plus an additional individual.
- Save an independent assessment using both desktop drag-and-drop and mobile tap assignment.
- Confirm the independent person appears in analytics without increasing the workshop count.
- Select its leader and verify Team View/Team Map output.
- Confirm analytics totals count a person once when they appear in multiple workshops.
- Confirm reversed Genius order lands in the same pairing and pairing counts follow every analytics filter.
- Confirm each analytics card drill-down count matches its card and retains active filter context.
- Save a workshop with time values and confirm the page updates without a manual refresh.
- Edit and delete a group, then confirm each operation after a full refresh.
- Build a workshop roster from existing people, add a new individual from the same flow, select a leader, and generate its Team Map.

### Near-term polish

- Design a dedicated workshop-result notes phase, including note scope, editing history, and whether notes belong to a workshop, a person, or the assembled team result.
- Add clearer loading/progress feedback if a large historical backfill takes noticeable time.
- Add filters for people by client, workshop, group, and Genius role if the library grows large.
- Consider a non-destructive person-detail view showing every workshop and group membership.
- Consider export/backup tools for the canonical assessment library and group definitions.
- Continue accessibility testing for keyboard navigation, focus handling, contrast, and dialogs.

### Later opportunities

- Bulk entry assistance for historical workshops while preserving manual review.
- Additional reporting across clients, workshop participation, and group composition.
- Optional group duplication/templates for recurring teams.
- Automated regression coverage for calculations, normalization, and data migrations.

## Guardrails

- Do not make email a required assessment identity field; the official export does not contain it.
- Do not duplicate canonical assessments merely because a person belongs to multiple groups.
- Do not store locally printed Team Maps in Sheets or Drive unless the product decision changes explicitly.
- Do not change the estimate-before-workshop business sequence.
- Do not sacrifice landscape-specific mobile layouts or US Letter print fidelity.
