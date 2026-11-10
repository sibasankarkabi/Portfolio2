# UX Leadership Search

A personal job tracker for UX leadership roles: roles, fit scores, application packs (cover note, outreach message) and a tailored resume per role.

## Run it locally
Open this folder in VS Code and start **Live Server** on `index.html`. Double-clicking the file won't work, because the page loads `data/roles.json`.

## Publish on GitHub Pages
1. Create a repository and push this folder.
2. Settings → Pages → Source: deploy from branch `main`, folder `/ (root)`.

## Files
- `index.html`: the whole app (styles and script inline).
- `data/roles.json`: the roles. Replace this file to load newer roles.
- `resumes/`: the tailored resume PDFs (phone number removed). Each role's `resumeFile` points at one.

## Where your changes live
Statuses, notes and roles you add are saved in your browser (localStorage), not in `roles.json`. Use **Export my statuses** to back them up.

## Privacy
A public GitHub Pages site can be opened by anyone with the address. The resumes show your email. `robots.txt` and a `noindex` tag ask search engines not to list it, but that isn't access control. Use a private repository if you don't want it public (GitHub Pages on a private repo needs a paid plan).
