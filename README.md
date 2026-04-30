# Weikai Huang's Personal Website

🌐 **Live Site**: [https://weikaih04.github.io](https://weikaih04.github.io)

This is the source code for my personal academic website, built with Jekyll and GitHub Pages.

## About Me

I am an incoming PhD student at the University of Washington, working on computer vision and multimodal AI research at the [UW CSE RAIVN Lab](https://raivn.cs.washington.edu/) and [Allen Institute for AI](https://allenai.org/).

## Features

- 📝 Dynamic publications list with Selected/All toggle
- 💡 TL;DR summaries for papers (expandable)
- 🎨 Elegant EB Garamond font
- 📱 Fully responsive design
- 🔄 JSON-based publication management

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
  "links": {
    "paper": "url",
    "code": "url"
  },
  "selected": true,
  "tldr": "Brief summary of the paper..."
}
```

See `USAGE_GUIDE.md` for detailed instructions.

## File Structure

```
├── _layouts/          # Jekyll layouts
├── assets/
│   ├── css/          # Stylesheets
│   └── js/           # JavaScript files
├── img/              # Images
│   └── papers/       # Publication images
├── publications.json # Publication data
├── index.md          # Main page
└── _config.yml       # Jekyll configuration
```

## Documentation

- **USAGE_GUIDE.md** - Comprehensive usage guide
- **CHANGES.md** - Recent changes and updates

## Technologies

- Jekyll (Static Site Generator)
- GitHub Pages (Hosting)
- EB Garamond (Typography)
- Vanilla JavaScript (Interactivity)

## Contact

- Email: weikaih@cs.washington.edu
- Twitter: [@weikaih04](https://twitter.com/weikaih04)
- LinkedIn: [Weikai Huang](https://www.linkedin.com/in/weikaihuang/)

## License

Feel free to use this template for your own website. Attribution appreciated but not required.

---

Last updated: October 2025