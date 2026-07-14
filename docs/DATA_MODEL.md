# Data Model

## Conventions

- Google Sheets is the durable source of truth.
- Business IDs use prefixes such as `CLI-`, `EST-`, `WRK-`, and `INV-`.
- Assessment-library IDs use UUID-backed prefixes: `PER-`, `GRP-`, `GMB-`, and `DUP-`.
- Archive fields apply to business records: `archived`, `archivedDate`.
- Assessment records use `Active` flags so import and merge history can be retained.
- Dates are stored as sheet values or ISO strings and normalized by the frontend.
- Header changes are additive. Do not reorder or delete existing production columns casually.

## Core business sheets

### Clients

Primary key: `ClientID`.

Principal fields used by the application include organization, contact, email, phone, notes, and archive metadata. Clients connect estimates, workshops, invoices, and optional custom groups.

### Estimates

Primary key: `id`.

Key relationships and added fields include:

- `ClientID`, `ClientName`, `ClientEmail`
- `consultingDiscount`, `prepDiscount`, `assessmentDiscount`
- normalized itemization fields used by previews and generated PDFs
- PDF metadata: `pdfUrl`, `pdfFileId`, `pdfGeneratedDate`
- email metadata: `sentDate`, `firstSentDate`, `lastSentDate`, `sentTo`, `sentCc`, `sentSubject`, `sendCount`
- archive metadata

### Workshops

Primary key: `WorkshopID`.

Managed fields added by the current application:

`WorkshopDate`, `DateDescription`, `StartTime`, `EndTime`, `Location`, `DeliveryFormat`, `Participants`, `PrimaryContact`, `ContactEmail`, `Notes`, `EstimateID`, `InvoiceID`, `FollowUpDate`, `Status`, `Type`, `ClientID`, `Organization`, plus archive metadata.

`WorkshopDate` is optional. `DateDescription` supports values such as “Spring 2019” or “date unknown.”

### Invoices

Primary key: `invoiceNo`.

Key relationships and lifecycle fields include:

- `ClientID`, client name, and client email
- estimate/source references and normalized itemization fields
- status and terms
- line discounts
- `amountPaid`, `balanceDue`, `paidDate`, `paymentMethod`, `paymentReference`, `voidReason`
- invoice footer and payment instructions
- PDF, email, and archive metadata

### Settings

Key/value rows used for business name, email, phone, address, invoice footer, payment instructions, and check-payee information. Credentials do not belong here or in Git.

### Rates

Key/value rows used by `rates.js` and financial PDF reconstruction. The admin page displays these values but directs edits to Google Sheets.

## Assessment sheets

### AssessmentImports

One row describes an uploaded workbook associated with a workshop.

Fields:

`AssessmentImportID`, `WorkshopID`, `GroupName`, `OriginalFileName`, `ParticipantCount`, `ImportedDate`, `UpdatedDate`, `Active`, `ImportStatus`, `ValidationWarnings`, `SourceType`, `SourceVersion`, `LeaderAssessmentResultID`, `LeaderFirstName`, `LeaderLastName`, `LeaderSelectedDate`, `LeaderUpdatedDate`, `TeamPdfFileId`, `TeamPdfUrl`, `TeamPdfGeneratedDate`.

The current Team Map flow does not persist Team Map PDFs, so the legacy Team PDF fields should remain empty.

### AssessmentResults

One row is a participant result within an import and therefore also records workshop participation.

Fields:

`AssessmentResultID`, `AssessmentImportID`, `WorkshopID`, `PersonID`, `FirstName`, `LastName`, `DisplayName`, `GroupName`, `Genius1`, `Genius2`, `Competency1`, `Competency2`, `Frustration1`, `Frustration2`, `SortOrder`, `ImportedDate`, `UpdatedDate`, `Active`.

`PersonID` links the workshop result to the canonical person. Multiple active results may reference one person when that person participated in multiple workshops.

### AssessmentImportHistory

Append-only audit information for initial import, merge, replace, and removal activity.

Fields:

`AssessmentImportEventID`, `AssessmentImportID`, `WorkshopID`, `UploadMode`, `OriginalFileName`, `UploadedDate`, `UploadedParticipantCount`, `NewParticipantCount`, `UpdatedParticipantCount`, `UnchangedParticipantCount`, `DuplicateIgnoredCount`, `ConflictCount`, `PreviousTotalCount`, `FinalTotalCount`, `GroupNameBefore`, `GroupNameAfter`, `LeaderBefore`, `LeaderAfter`, `Notes`.

### AssessmentPeople

Canonical one-assessment-per-person record.

Fields:

`PersonID`, `FirstName`, `LastName`, `DisplayName`, `NameKey`, `Genius1`, `Genius2`, `Competency1`, `Competency2`, `Frustration1`, `Frustration2`, `CreatedDate`, `UpdatedDate`, `Active`.

Because official exports contain no email, identity matching uses normalized first/last names plus the complete six-placement assessment fingerprint.

- Same normalized name and same fingerprint: automatically reuse the person.
- Same normalized name and conflicting fingerprint: retain separate candidates and show a possible-duplicate review.
- Confirmed merge: update workshop and group references to the retained `PersonID`, then deactivate the merged person.
- Confirmed different people: store the decision so the pair is not repeatedly shown.

### AssessmentGroups

Reusable group metadata independent of workshops.

Fields:

`GroupID`, `GroupName`, `ClientID`, `Organization`, `Description`, `CreatedDate`, `UpdatedDate`, `Active`.

### AssessmentGroupMembers

Many-to-many link between groups and people.

Fields:

`GroupMemberID`, `GroupID`, `PersonID`, `IsLeader`, `AddedDate`, `UpdatedDate`, `Active`.

Only one current group member should be selected as leader. A person may lead multiple groups because leadership is membership-specific.

### AssessmentDuplicateReviews

Stores duplicate-resolution decisions.

Fields:

`DuplicateReviewID`, `PersonID1`, `PersonID2`, `Status`, `ResolutionDate`, `Notes`.

## Relationships

```text
Client
  ├─< Estimate
  ├─< Workshop ──< AssessmentImport ──< AssessmentResult >── Person
  ├─< Invoice
  └─< AssessmentGroup ──< AssessmentGroupMember >────────── Person
```

## Migration behavior

The first `getAssessmentWorkspace` call after deploying version `2026.07.13.03`:

1. Creates missing assessment-library sheet tabs.
2. Adds `PersonID` to `AssessmentResults` if needed.
3. Reads active workshop imports and results.
4. Creates or reuses canonical people.
5. Writes canonical `PersonID` references back to historical active result rows.

This process does not delete existing workshop imports or results.
