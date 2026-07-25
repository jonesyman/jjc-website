# JJP 3D Printing Setup

## Google resources

- Spreadsheet ID: `1awuRVwSa7hy4rAoC21fKvB1ctMNmZi82dwDhe6WTxYw`
- Generated-documents folder ID: `1Q2B7z4q-HZdVX-wEP9L5XchEUacurgxZ`

Keep both resources private and owned by the Google account that deploys the JJP Apps Script.

## Install the bound Apps Script

1. Open the **JJP Operations** spreadsheet.
2. Open **Extensions → Apps Script**.
3. Replace the editor's `Code.gs` contents with `apps-script-jjp/Code.gs`.
4. In Project Settings, enable display of the `appsscript.json` manifest.
5. Replace the manifest with `apps-script-jjp/appsscript.json`.
6. Save the project.
7. Select and run `initializeJjpDatabase`.
8. Approve the requested Sheets, Drive, and Documents permissions.

The initializer is safe to run again. It creates missing tabs and columns, seeds starter pricing records only when their libraries are empty, and creates Quotes, Invoices, Project Files, and Archived Documents folders under **JJP Generated Documents**.

## Add the logo to generated PDFs

The website uses the JJP logo recovered from the Android ZIP. To use it in Apps Script PDFs:

1. Upload `assets/images/JJP_Logo.png` to the private **JJP Generated Documents** folder.
2. Copy the image's Google Drive file ID.
3. In JJP **Settings**, save it under **PDF logo Drive file ID**.

PDF generation works without a logo file ID and uses the business name as the primary branding.

## Deploy the JJP web app

1. Choose **Deploy → New deployment → Web app**.
2. Execute as the deploying owner.
3. Use the same access pattern as the Consulting Apps Script.
4. Deploy and copy the `/exec` URL.
5. Replace `PASTE_JJP_APPS_SCRIPT_WEB_APP_URL_HERE` in `assets/js/jjpApi.js` with that URL.
6. Load `/admin/jjp.html`, confirm the connection notice is gone, and exercise one read and one write.

Create a new deployment version after every JJP Apps Script change.

## Verification

- Confirm all database tabs and four document subfolders exist.
- Create a test client and project.
- Confirm the starter filament and additional-cost records.
- Create a quote with filament, machine time, labor, and an additional cost.
- Convert it to an invoice.
- Generate both PDFs and confirm their Drive locations.
- Check desktop, mobile portrait, and mobile landscape layouts.

## Deferred Consulting organization task

After JJP is complete and deployed, review the Consulting Google Sheet and Google Drive folder organization as a separate project. Do not combine that cleanup with the JJP deployment.
