# Adetutu (Tutu) Adenusi — 2027 Career Portfolio Refresh

**Site:** https://aoadenus.github.io/  
**Repository:** https://github.com/aoadenus/aoadenus.github.io

This is a **staged replacement package**, not a change to the live GitHub repository. The existing six-page architecture is retained, with updated HTML, a shared stylesheet and an accurate résumé PDF.

## What's included

| File | Purpose |
|---|---|
| `index.html` | 2027 career positioning, selected projects and clear calls to action |
| `about.html` | Education, verified career narrative and credentials |
| `projects.html` | Nine categorized, attributed academic/hackathon/personal projects |
| `experience.html` | Conservative Accellux and hospitality descriptions, professional affiliations |
| `skills.html` | Practical skills and SAP/ITIL certifications |
| `contact.html` | 2027 availability and professional contact links |
| `style.css` | Shared responsive theme: cream, lilac, plum, pastel cards, serif display headings |
| `Adetutu_Adenusi_Resume.pdf` | Conservative one-page BSA-focused résumé, staged for review |
| `DEPLOYMENT_CHECKLIST.md` | Manual publication and review checklist |

## Technology

Vanilla HTML and CSS, no build step, no framework, and no JavaScript requirement. Responsive mobile navigation uses native HTML `<details>`/`<summary>` rather than a hidden menu. Scroll-reveal content does not depend on JavaScript.

## Local preview

```bash
python -m http.server 8000
# http://localhost:8000/
```

## Changes vs. June 29 site

- Replaced Summer 2026 intern availability with 2027 full-time/new graduate positioning.
- Put **Business Systems Analysis** first, with enterprise applications and data as secondary strengths.
- Corrected Accellux wording to supervised SAP FI/CO exposure; removed claims of production delivery, named clients, defect logging and UAT execution.
- Replaced "Discovering SAP" with **SAP Certified - Implementation Consultant - End-to-End Business Processes for SAP Business Suite (Oct 2026)** and **ITIL 4 Foundation (Sep 2026)**.
- Preserved seven existing project themes; added ProcessDoctor and Mama's Little Bakery (nine in total).
- Corrected the homepage "Explore Projects" CTA and README project count.
- Added responsive navigation and focus-visible styles, skip link, reduced-motion support, page metadata, and no JS-dependent content visibility.
- Removed unverified hotel performance statistics and public phone number from website body.

## Claims/links requiring owner review before deployment

- Check external short links to ProcessDoctor's demo and team repository; they were shared in a LinkedIn post and have not been confirmed as canonical long URLs.
- Mama's Little Bakery has no verified public repository URL, so its card uses an "available upon request" label.
- Review the included staged résumé PDF, especially personal contact details, team contributions and credentials.
- In the header/metadata, confirm May 2027 graduation and 2027 start availability.
- The live repo has NOT been modified; publish only after reviewing `DEPLOYMENT_CHECKLIST.md`.
