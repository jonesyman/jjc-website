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
- Assessment Analytics with filter-responsive Genius counts and unique-person totals.
- Tutorial and Best Practices page.
- Dark Working Genius-inspired visual refresh.
- Mobile portrait/landscape layouts, compact filters, and expandable record actions.
- Canonical assessment people, reusable groups, duplicate review, and group Team Maps.
- Ad hoc individual assessment entry with drag/tap card assignment and analytics inclusion.

## Current release boundary

Version `2026.07.14.01` adds independent assessment entry to the assessment library. It requires both:

1. A new Google Apps Script deployment containing the updated `Code.gs`.
2. The corresponding static-site commit on the deployed Git branch.

See `CURRENT_STATE.md` before continuing.

## Recommended next work

### Immediate validation

- Deploy Apps Script and allow the first assessment-library backfill to complete.
- Confirm the created sheet tabs and `PersonID` links.
- Review possible duplicate names before building production groups.
- Create a real custom group from a workshop plus an additional individual.
- Save an independent assessment using both desktop drag-and-drop and mobile tap assignment.
- Confirm the independent person appears in analytics without increasing the workshop count.
- Select its leader and verify Team View/Team Map output.
- Confirm analytics totals count a person once when they appear in multiple workshops.

### Near-term polish

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
