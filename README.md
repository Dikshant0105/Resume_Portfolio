# Dikshant Meshram — Portfolio

Personal portfolio site: plain HTML, CSS and JavaScript (no build step), hosted on GitHub Pages.

## Pages
- `index.html` — home: intro, timeline, impact, toolkit, contact
- `projects.html` — all 14 projects with filters
- `about.html` — story, how I work, interests and photos
- `contact.html` — contact form

## How it connects
`assets/js/site.js` sends contact-form messages, visit counts and chat questions to a Google Apps Script
web app (the "Portfolio Tracker"), which logs them to Google Sheets and answers chat questions from the
resume using Groq. The Groq API key is stored only in the Apps Script's Script Properties — never in this repo.

## Editing
- Text lives directly in the `.html` files.
- Styles: `assets/css/site.css`. Photos: `assets/img/`.
- Resume: upload the PDF as `assets/Dikshant-Meshram-Resume.pdf`; the Resume buttons switch to it automatically.
- Stop counting your own visits: open the site once with `?notrack=1` at the end of the URL.

## Custom domain
In the repo's **Settings → Pages → Custom domain**, enter the domain, then add the DNS records GitHub shows.
