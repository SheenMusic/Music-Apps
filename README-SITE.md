# Sheen Yang Website

This folder is ready to upload to the root of the GitHub repository used by GitHub Pages.

## Structure

- `index.html` — homepage/UI. Usually does not need editing.
- `data/works.json` — original music and arrangements.
- `data/scores.json` — transcription/engraving projects.
- `data/courses.json` — courses and interactive learning tools.
- `works/`, `scores/`, `courses/` — automatically render the corresponding JSON data.
- Keep the existing `ET-Intervals/` folder in the GitHub repository. Do not delete it.

## Adding an item

Append an object to the appropriate JSON array. Example:

```json
{
  "title": {
    "zh": "作品名称",
    "en": "Work Title",
    "ja": "作品タイトル"
  },
  "description": {
    "zh": "中文简介",
    "en": "English description",
    "ja": "日本語の説明"
  },
  "year": "2026",
  "type": {
    "zh": "原创音乐",
    "en": "Original Music",
    "ja": "オリジナル音楽"
  },
  "tags": ["Logic Pro", "MIDI"],
  "url": "https://example.com",
  "external": true
}
```

For an internal course, `url` can be something like:
`../ET-Intervals/01-Direction/`

JSON rules:
1. Items are separated by commas.
2. No comma after the last item.
3. Use double quotes.
4. Keep the outer `[ ... ]`.

## GitHub Pages deployment

Upload/commit these files to the repository root. Preserve the existing `ET-Intervals/` directory.
GitHub Pages will publish after the commit finishes deploying.

## Deployment workflow

This repository includes `.github/workflows/pages.yml` for a plain static-site deployment to GitHub Pages.
It runs automatically on every push to `main` and can also be run manually from Actions.
The repository's Pages source should remain set to **GitHub Actions** when using this workflow.
