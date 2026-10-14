# Weikai Huang's Personal Website

🌐 **Live Site**: [https://weikaih04.github.io](https://weikaih04.github.io)

This is the source code for my personal academic website, built with Jekyll and GitHub Pages.

## About Me

I am a PhD student at the University of Washington ([UW CSE RAIVN Lab](https://raivn.cs.washington.edu/)), working on computer vision and robotics.

## Features

- Research themes at the top; clicking one filters the publication list
- Single-column publication list with autoplaying (on-screen only) teaser videos and a click-to-expand lightbox
- Filters: Selected / All / 3D Vision / Robotics / Multimodal (a paper can be in several)
- Long author lists collapse to six names (your own name is always kept visible)
- Source Serif 4 typography, warm off-white palette
- JSON-based publication management; stars and citations auto-updated by a GitHub Action

## Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/weikaih04/weikaih04.github.io.git
cd weikaih04.github.io

# Install dependencies (if using Jekyll)
bundle install

# Run local server
bundle exec jekyll serve

# Or use Python for quick testing
python3 -m http.server 8000
```

Visit `http://localhost:4000` (Jekyll) or `http://localhost:8000` (Python)

## Adding Publications

Edit `publications.json` to add or update publications:

```json
{
  "id": "paper-id",
  "title": "Paper Title",
  "authors": ["Author 1", "Weikai Huang", "Author 3"],
  "venue": "Conference Name",
  "year": "2025",
  "image": "img/papers/image.png",
  "arxiv_id": "2610.12345",
  "github_repo": "owner/repo",
  "themes": ["3d", "robotics"],
  "links": {
    "arxiv": "url",
    "code": "url"
  },
  "selected": true,
  "tldr": "Brief summary of the paper..."
}
```

### ⚠️ Checklist for every new paper

The GitHub Action (`.github/workflows/update-metrics.yml`) runs `update_metrics.py` every 6 hours. It only fills in metrics for papers that have these two fields, so **add both whenever you add a paper**:

- **`github_repo`**: `"owner/repo"` (e.g. `"ToberJ/reflex"`), not the full URL. Without it, the Code link shows no ★ star count.
- **`arxiv_id`**: e.g. `"2610.12772"`. Without it, citation counts are not fetched.

Also set **`themes`** to one or more of `"3d"`, `"robotics"`, `"multimodal"`. This decides which filter buttons show the paper; papers with `"selected": true` also appear as tags under their research theme at the top of the page. Theme names and descriptions live at the top of `assets/js/publications.js`, as does the short tag name for each paper (`SHORT`).

Use `"local_video"` (an `.mp4` in `img/papers/`) for an autoplaying teaser, or `"image"` for a still. Awards go in `"award"`, separated by `;`.

Do not write `github_stars` or `citations` by hand; the Action fills them in.

## File Structure

```
├── _layouts/default.html    # Page shell (fonts, stylesheet, script)
├── index.html               # Page content: bio, news, experience, awards, ...
├── assets/css/style.scss    # All styles (no theme CSS is imported)
├── assets/js/publications.js# Research themes, publication list, news toggle, video lightbox
├── img/papers/              # Teaser videos and images
├── publications.json        # Publication data
├── update_metrics.py        # Fetches GitHub stars / citations (run by the Action)
└── _config.yml              # Jekyll configuration
```

## Technologies

- Jekyll (Static Site Generator)
- GitHub Pages (Hosting)
- Source Serif 4 (Typography)
- Vanilla JavaScript (Interactivity)

## Contact

- Email: weikaih@cs.washington.edu
- Twitter: [@weikaih04](https://twitter.com/weikaih04)
- LinkedIn: [Weikai Huang](https://www.linkedin.com/in/weikaihuang/)

## License

Feel free to use this template for your own website. Attribution appreciated but not required.

---

Last updated: October 2026