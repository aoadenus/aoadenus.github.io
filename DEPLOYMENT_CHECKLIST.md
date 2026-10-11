# Portfolio deployment checklist — October 2026

**Status: NOT PUBLISHED.** The GitHub connector read your portfolio repository, but a branch-creation request returned HTTP 403 (`Resource not accessible by integration`). This package is a local staging output.

## Review content before publishing
- [ ] Confirm site headline: primary lane **Business Systems Analysis**; complementary enterprise applications and data.
- [ ] Confirm SAP/ITIL credential titles and earned months.
- [ ] Confirm Accellux supervised-practice description matches current LinkedIn.
- [ ] Confirm nine project summaries, role attribution, metrics and links.
- [ ] Open the included PDF resume; confirm email/phone and any résumé claims.
- [ ] Decide whether to publish both ProcessDoctor short links or replace with direct GitHub/YouTube URLs.

## Deployment (existing repository)
1. Back up `master` before overwriting. Make a branch named `portfolio-2027-refresh` in the GitHub UI or via Git on your computer.
2. Extract these package files into the repository root (where `index.html` already sits). Replace the existing six HTML files, `style.css`, résumé and README; add this checklist if desired.
3. Preview with `python -m http.server 8000` and visit `http://localhost:8000`.
4. Check 375px mobile, ~768px tablet, and 1280px desktop widths. On mobile, click `Menu` and follow each page link.
5. Test: project links, all PDF download buttons, keyboard Tab/Enter, skip link, reduced-motion OS setting, mailto links and all nine project cards.
6. Commit and push your branch. Review a pull request then merge into `master`. GitHub Pages will update from the configured publishing branch.
7. After deployment, force-refresh the public site and check Home, About, Projects, Experience, Skills, Contact, and the resume URL.

**Important:** Your `C:/Users/...` local folder was not accessible to this session. The refreshed files are based on your published repository's observed content and your October 2026 career sources.
