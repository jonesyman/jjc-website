# Project Context

## Purpose

This application supports Jeff Jones Consulting from the first client conversation through estimates, workshops, assessment analysis, invoicing, and follow-up. It is a focused single-user business system, not a general-purpose CRM.

The public site explains the consulting offering. The private `/admin/` area is the operational console and is protected at the hosting layer.

## Primary workflow

The normal engagement sequence is:

1. Confirm settings and rates.
2. Create or reuse the client.
3. Prepare and send the estimate.
4. After acceptance, create and schedule the workshop.
5. Create and manage the invoice.
6. Upload the official Working Genius Individual Results workbook from the workshop, or assemble the roster from existing individual results when no workbook exists.
7. Add any additional individual results, select the leader, and review the Team View.
8. Preview and locally print/save the Team Map.
9. Add independent individual assessments when needed and build reusable groups when a team does not map one-to-one to a workshop.
10. Review unique-person, individual-Genius, and 15-pairing assessment analytics, and open any metric card to see the matching filtered people.
11. Complete follow-up and maintain the records.

The admin sidebar currently follows this order:

`Dashboard → Clients → Estimates → Workshops → Assessments & Groups → Invoices → Assessment Analytics → Tutorial & Best Practices → Settings`

## Assessment rules

- The official portal export does not contain email addresses.
- A person normally takes the assessment only once.
- Workshop uploads remain the normal way assessment results enter the application.
- A workshop roster may also be assembled or extended from existing canonical people without duplicating their assessment records.
- Individual results received outside a workshop may be entered directly by assigning the six Working Genius cards to Genius, Competency, and Frustration.
- One canonical person/assessment may be referenced by multiple workshops and custom groups.
- Analytics treats the two Genius positions as an unordered pairing; WI and IW are the same named pairing.
- Custom groups do not need a workshop or date. Examples include families, departments, leadership teams, and former employees.
- A group can copy members from an individual search, a workshop roster, or another saved group.
- Saved groups can be chosen from the manager at the top of Group Builder, loaded for maintenance, deleted when genuinely unnecessary, restored from Recently Deleted Groups, or opened directly in Team Map preview.
- Adding another group copies its current person references; groups are not nested.
- Leader status belongs to a specific workshop or group, not permanently to the person.
- Team Maps are previewed in the application and printed or saved locally. They are not stored in Google Sheets or Drive.
- In Team Maps, Genius names are green, Frustration names are red, and the leader is marked with an asterisk without bolding.
- Graphical Team Map names start at one uniform 13px size. If any list would overflow, every name shrinks together; empty areas remain blank.
- Notes about workshop assessment results are a planned separate capability and are not part of roster assembly.

## Business and interface preferences

- Estimates normally precede workshops.
- Preserve historical records; prefer archive, inactive, void, canceled, replace, or merge workflows over deletion.
- Historical workshops may have an exact date, a descriptive timeframe, or no known date.
- Public and admin visuals use a restrained dark-blue Working Genius-inspired palette.
- Passive informational cards should not use hover motion that makes them appear clickable.
- Animations should be subtle and respect reduced-motion settings.
- Mobile portrait and landscape layouts must be meaningfully different across every page.
- Mobile record cards should show the most important actions and place additional buttons in an expandable menu.
- Long people libraries should scroll inside a bounded pane rather than extending the entire page.
- The primary mobile reference is a Samsung Galaxy Ultra-class phone. Test practical CSS viewports such as approximately `412 × 915` portrait and `915 × 412` landscape; physical screen resolution is not the CSS viewport.
- Printed estimates, invoices, and Team Maps must retain a clean US Letter layout independent of screen size.

## Terminology

- **Assessment result:** The six ordered Working Genius placements for one person: two Geniuses, two Competencies, and two Frustrations.
- **Person:** The canonical assessment identity used across workshops and groups.
- **Workshop:** A business event that may own an assessment import.
- **Group:** A reusable collection of canonical people that does not need to represent an event.
- **Team View:** The six on-screen Genius/Frustration cards derived from a roster and selected leader.
- **Team Map:** The printable six-panel team document generated from the Team View data.
