# Jeff Jones Consulting Website

Static public website and private business consoles for Jeff Jones Consulting and Jeff Jones Prints. Consulting retains its Working Genius workflow; the separate JJP page manages 3D-printing clients, projects, pricing libraries, quotes, invoices, and PDFs.

## Documentation

- [Project context](docs/PROJECT_CONTEXT.md)
- [Current state and handoff](docs/CURRENT_STATE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [Roadmap](docs/ROADMAP.md)
- [Changelog](CHANGELOG.md)
- [Contributing and deployment](CONTRIBUTING.md)
- [JJP setup and deployment](docs/JJP_SETUP.md)

New development tasks should read the documents above and inspect the latest Git status and history before changing the application.

## Repository layout

- `index.html` — approved public homepage.
- `home-preview.html` — public design preview retained for comparison.
- `admin/index.html` — private admin console and its page-level behavior.
- `admin/jjp.html` — separate green JJP 3D-printing console under the protected admin route.
- `assets/js/` — domain modules, calculations, assessment parsing, data access, and branding.
- `assets/css/` — public and admin stylesheets; the current admin page also contains substantial inline styling.
- `apps-script/` — Google Apps Script API, Google Sheets persistence, Drive PDF generation, and Zoho email integration.
- `apps-script-jjp/` — independent JJP Apps Script API, spreadsheet setup, pricing persistence, and Drive PDF generation.

## Deployment summary

The website is hosted through Cloudflare from the Git repository. The backend is a separately deployed Google Apps Script web application. When `apps-script/Code.gs` changes, deploy Apps Script first, then push/deploy the website. See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete checklist.

## Versioning

Update both visible version locations in `admin/index.html` with every application release:

- The sidebar version label.
- The `APP_VERSION` constant.

The current version is `2026.08.18.01`.
