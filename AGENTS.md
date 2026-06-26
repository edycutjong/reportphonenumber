# AGENTS.md

> **System Directive:** You are an autonomous AI coding agent operating within this repository. Read this document fully before modifying any files or executing any terminal commands.

## 1. Project Overview
- **Name:** PhoneShield
- **Type:** Single-Page PWA Web App
- **Primary Language:** HTML5, CSS3, JavaScript (ES6)
- **Core Frameworks:** Vanilla JavaScript, Chart.js (via CDN)

## 2. Hard Constraints (THE "DO NOTS")
*Violating these rules is considered a critical task failure.*

- **NEVER** commit `.env` files, hardcoded API keys, or secrets.
- **NEVER** force-push to `main` or `master`.
- **DO NOT** introduce new 3rd-party npm packages/dependencies without asking the user first.
- **DO NOT** delete existing tests.

## 3. Environment & Verification
*You must verify your work. After making ANY logic change, verify in the browser or run local server.*

- **Install Dependencies:** `n/a` (using CDNs)
- **Run Local Dev:** `npx http-server`
- **Run Test Suite:** `n/a`
- **Run Linter/Formatter:** `n/a`

## 4. Architecture & Map
- `/index.html` -> Main structure & PWA shell.
- `/style.css` -> Modern neon glassmorphism stylesheet.
- `/app.js` -> Main JavaScript logic, storage layer, charts, and verification algorithms.
- `/manifest.json` -> Web app manifest for PWA capabilities.
- `/sw.js` -> Service worker caching script.

## 5. Coding Conventions
- **Typing:** Strict typing enforced. No `any` in TypeScript / Use Python `TypeHints` everywhere.
- **Imports:** Use absolute paths `@/components/...` rather than relative `../../components/...`
- **Error Handling:** Never swallow errors with bare `try/catch`. Always throw domain-specific custom errors defined in `/src/errors.ts`.
- **Comments:** Do not write comments explaining *what* the code does; write comments explaining *why* a non-obvious decision was made.

## 6. Git & Commit Etiquette
- **Branch Naming:** `agent/<issue-id>-<short-slug>` (e.g., `agent/102-fix-login-redirect`)
- **Commit Format:** Use Conventional Commits:
  - `feat: ...` for new features
  - `fix: ...` for bug fixes
  - `refactor: ...` for code changes that neither fix a bug nor add a feature
  - `test: ...` for adding missing tests

## 7. Escalation Protocol 
**STOP executing and prompt the human user for input if:**
1. A unit test fails **3 times in a row** after your attempted fixes.
2. Implementing the request requires a Database Schema migration.
3. The user's prompt contains mutually exclusive or ambiguous instructions.