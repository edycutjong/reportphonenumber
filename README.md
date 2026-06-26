# 🛡️ PhoneShield Report Generator

A clean, responsive, single-page Progressive Web App (PWA) that converts Excel (`.xlsx`/`.xls`) or CSV spreadsheets into a grid of visual transaction cards and exports them to Microsoft Word (`.doc`) and high-fidelity PDF (`.pdf`) formats. Built entirely client-side with zero server-side dependencies.

## 🚀 Live Demo & Hosting
Since this project is 100% static, it is hosted on **GitHub Pages** at:
`https://<username>.github.io/<repository-name>/`

---

## ✨ Features
- **Spreadsheet Parser**: Parses `.xlsx`, `.xls`, and `.csv` files locally in the browser (powered by [SheetJS](https://sheetjs.com/)).
- **Visual Card Grid Layout**: Renders transaction cards in a 2-column responsive layout:
  - Sequence indices and bold phone numbers in the header.
  - Classic blue horizontal divider line (`2px solid #2563eb`).
  - Key-value metadata table for *Tanggal*, *Waktu*, *Provider*, *No. Pelanggan*, *Serial Number*, and *Status*.
  - Status pill badges color-coded based on value (Green for "Sukses", Amber for "Pending", Red for "Gagal").
- **Microsoft Word Export**: Generates a grid-preserving Word Document (`.doc`) using a compatible table structure.
- **Landscape PDF Export**: Compiles report cards into a landscape A4 PDF format (powered by [html2pdf.js](https://github.com/eKoopmans/html2pdf.js)).
- **Progressive Web App (PWA)**: Fully installable on mobile and desktop devices with complete offline support via Service Worker caching.
- **Stress-Tested Performance**: Verified rendering capacity up to 500+ records seamlessly. Includes an built-in stress-test dataset.

---

## 🛠️ Getting Started

### Prerequisites
To run the app locally, you only need a simple HTTP server (to support PWA service worker registration and local module loading):

- **Using Node.js**:
  ```bash
  npx http-server -p 8088
  ```
- **Using Python**:
  ```bash
  python3 -m http.server 8088
  ```

Open your browser and navigate to `http://127.0.0.1:8088/`.

---

## 📋 Spreadsheet Template Requirements
The parser dynamically matches header columns (case-insensitive). For the best results, structure your Excel sheet with the following headers:

| Header Column | Description | Example Value | Matches Pattern |
| :--- | :--- | :--- | :--- |
| **No** | Row sequence index | `1` | `no` |
| **No Pelanggan** | Phone number (formatted as text to prevent scientific notation) | `085346958916` | `pelanggan`, `phone`, `number`, `tel` |
| **Tanggal** | Transaction date | `26/06/2026` | `tanggal`, `date` |
| **Waktu** | Transaction time | `15:02:55` | `waktu`, `time` |
| **Provider** | Telecommunication carrier | `Telkomsel` | `provider`, `operator`, `carrier` |
| **Serial Number**| Device / Transaction SN | `SN2026000001` | `serial`, `sn`, `s/n` |
| **Status** | Transaction status | `Sukses` / `Pending` / `Gagal` | `status` |

*Note: If optional columns are missing, default values (like current date/time and "Sukses" status) are generated automatically.*

---

## 🤖 Continuous Integration & Semantic Release
This repository uses a **GitHub Actions** workflow to automate semantic version releases:
- Whenever commits are merged into the `main` branch, the workflow evaluates the commit messages.
- If they follow **Conventional Commits** (e.g. `feat: ...`, `fix: ...`), it automatically calculates the next version (Major, Minor, or Patch), creates a Git tag, and generates a new GitHub Release.

### Commit Format Guidelines:
- `feat: ...` ➔ Triggers a **Minor** version bump (e.g. `v1.0.0` to `v1.1.0`).
- `fix: ...` ➔ Triggers a **Patch** version bump (e.g. `v1.0.0` to `v1.0.1`).
- `refactor: ...` / `style: ...` ➔ Does not trigger a version bump.
- Commits containing `BREAKING CHANGE:` in their body ➔ Trigger a **Major** version bump.
