# QA notes — staged portfolio refresh

**Completed October 11, 2026.**

- All six HTML pages parsed; each has exactly one `h1`, one `<main>`, a page title, a description, desktop and mobile navigation.
- All internal page and résumé links resolve to files in the staged package.
- Nine project cards are present.
- Scanned pages for the removed `Summer 2026`, `Discovering SAP`, and named-client language; none found.
- Rendered every page in headless Chromium at viewport widths **375px, 768px, and 1280px** using `set_content()` with CSS inlined. No horizontal scroll overflow was detected.
- Opened mobile `<details>` navigation and confirmed the Projects link becomes visible.
- Generated desktop and mobile screenshots in this package.
- The staged résumé PDF is one page and was visually checked. It contains no named-client or UAT execution claims.

**Not yet validated:** external project links and their redirects, GitHub Pages deployment, and clicked page-to-page navigation in a hosted browser. Direct browser navigation to `file://` and `localhost` was blocked by the execution environment; for that reason content was injected for layout QA, not loaded from the filesystem as a complete website. The owner must review the résumé before public publication.
