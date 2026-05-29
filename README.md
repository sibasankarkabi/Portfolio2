# Siba Sankar Kabi — Portfolio
## How to use, edit and deploy

---

## 📁 Folder Structure

```
sankarkabi/
│
├── index.html          ← The page shell. Rarely needs editing.
│
├── css/
│   └── style.css       ← All visual design. Edit colours in :root at the top.
│
├── js/
│   └── main.js         ← All behaviour + AI agent logic. Reads from data/siba.json.
│
├── data/
│   └── siba.json       ← ⭐ YOUR KNOWLEDGE BASE. Edit this file to update
│                          everything: bio, projects, metrics, tools, testimonials.
│                          The AI agent reads ONLY from this file.
│
├── images/             ← Your photos. Replace any file with the same filename
│   ├── profile.jpg       and the page updates automatically.
│   ├── about.jpg
│   ├── josh.jpg
│   ├── lourdes.jpg
│   ├── work-baptist.jpg
│   ├── work-tamm.jpg
│   ├── work-goodyear.jpg
│   ├── work-vs.jpg
│   ├── port-1.jpg ... port-4.jpg
│
└── README.md           ← This file
```

---

## ⭐ How to update your content

**Everything on the site comes from `data/siba.json`.** Open it in any text editor. Here is what each section controls:

| Section | What it affects |
|---|---|
| `identity` | Name, role, email, phone, LinkedIn, portfolio URL, availability message |
| `philosophy` | Your design + AI beliefs, personal approach, passions list |
| `current_role` | Studio name, team size, responsibilities list |
| `impact_metrics` | The 4 big numbers shown in the hero card and numbers strip |
| `awards` | GEM Award and project award descriptions |
| `projects` | Work section cards — each project has name, client, role, summary, detail, outcomes, image path |
| `work_history` | Experience timeline — role, company, period, description, chips |
| `skills.proficiency` | Animated skill bars — name and percentage |
| `skills.design_tools` | Design tool tags in About section |
| `skills.ai_tools` | AI tool tags with hover descriptions |
| `certifications` | Credentials list |
| `testimonials` | Colleague recommendations — name, role, photo path, quote text |
| `portfolio_items` | Portfolio grid — name, type, category (ux/web/logo), image path, link |
| `quick_search_pills` | The pill buttons below the AI search bar |

### Adding a new project

Open `data/siba.json`, find the `"projects"` array, and add:

```json
{
  "id": "my-new-project",
  "name": "My New Project Name",
  "client": "Client Name",
  "role": "Your Role",
  "image": "images/work-newproject.jpg",
  "featured": false,
  "tags": ["Tag1", "Tag2", "Tag3"],
  "summary": "One or two sentences about what the project was.",
  "detail": "More context about how you approached it and what made it interesting.",
  "outcomes": [
    "Key result 1 with a number if possible",
    "Key result 2"
  ],
  "ai_tools_used": ["Claude", "Figma Make"]
}
```

Then drop your image into `images/work-newproject.jpg`. Done.

### Updating a metric

Find `"impact_metrics"` in `siba.json` and change the value:
```json
"rfp_acv_increase": "18%"
```

### Adding a testimonial

Find `"testimonials"` array and add:
```json
{
  "name": "Person's Full Name",
  "role": "Their Title, Company",
  "photo": "images/their-photo.jpg",
  "initials": "PN",
  "text": "What they said about you."
}
```
Drop their photo in `images/` with the matching filename.

---

## 🤖 How the AI Agent works

The AI search bar in the hero asks: you type a question, it answers from `data/siba.json`.

**Two modes:**

1. **With a backend/proxy** (when deployed to Netlify or Vercel with an API key): sends your question to Claude AI, which reads the full knowledge base and generates a natural, warm, specific answer. This is the full AI agent experience.

2. **Without a backend** (opening the HTML file directly, or deployed as static): uses a built-in local answer engine that reads `siba.json` directly and matches questions to the right content. Works immediately with no setup.

**To enable full Claude AI answers on Netlify:**
1. Deploy this folder to [netlify.com](https://netlify.com) (drag-and-drop)
2. Add a `netlify/functions/search.js` serverless function (see the siba-portfolio.zip for this)
3. Set `ANTHROPIC_API_KEY` in Site Settings → Environment Variables
4. Redeploy

**⌨️ Keyboard shortcut:** Press `⌘K` (Mac) or `Ctrl+K` (Windows) from anywhere on the page to focus the search bar instantly.

---

## 🎨 Changing the look

**Colours:** Open `css/style.css` and edit the `:root` block at the top:
```css
:root {
  --gold:  #C8A84B;   /* accent gold — change this to your colour */
  --blue:  #3D6B8E;   /* secondary blue */
  --bg:    #0C0C0B;   /* page background */
  ...
}
```

**Fonts:** Swap the Google Fonts URL in `index.html` and update `--serif`, `--syne`, `--sans` in `style.css`.

**Profile photo:** Replace `images/profile.jpg` with your photo (same filename, JPG format).

---

## 🚀 Deployment

**Netlify (recommended, free):**
1. Go to netlify.com and log in
2. Drag the entire `sankarkabi/` folder onto the dashboard
3. Your site goes live in ~30 seconds

**Any static host (GitHub Pages, Vercel, etc.):**
Upload all files maintaining the folder structure. No build step needed.

**Running locally:**
```bash
# Python (built-in)
cd sankarkabi/
python3 -m http.server 8080
# Open http://localhost:8080
```
*(You need a local server — not file://) — because the JS fetches `data/siba.json`)*

---

*Last updated: May 2026*
