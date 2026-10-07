"""Generate only Portfolio pages and its Scores discovery block from works.json.

Run: python3 scripts/build-works.py
No dependencies; generated HTML is committed alongside the existing static site.
Master assets and deployment configuration are never read or changed here.
"""
from pathlib import Path
from html import escape
import json
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = {"original": ("原创器乐", "Original Works"),
              "transcription": ("扒谱作品", "Transcriptions")}
ANCHORS = {"original": "original", "transcription": "transcriptions"}


def e(value):
    return escape(str(value), quote=True)


def labels(zh, en):
    return (f'<span data-content-lang="zh">{e(zh)}</span>'
            f'<span data-content-lang="en" hidden>{e(en)}</span>')


def category(work):
    return labels(*CATEGORIES[work["category"]])


def url(work):
    return f'/works/{work["slug"]}/'


def text(value):
    if isinstance(value, dict):
        return labels(value.get("zh") or value.get("en", ""),
                      value.get("en") or value.get("zh", ""))
    return e(value or "")


def score_visible(work):
    return work.get("scoreMode") == "preview" and bool(work.get("score"))


def card(work, heading="h3"):
    description = (f'<p class="work-summary">{text(work["description"])}</p>'
                   if work.get("description") else "")
    thumbnail = (f'<img class="work-thumbnail" src="{e(work["thumbnail"])}" alt="" loading="lazy" width="640" height="360">'
                 if work.get("thumbnail") else "")
    media = labels("视频", "Video") if work.get("video") else ""
    year_line = f'<p class="work-category">{e(work["year"])}</p>' if work.get("year") else ""
    availability = f'<span class="work-availability">{media}</span>' if media else ""
    return f'''<a class="work-card" href="{url(work)}">
      {thumbnail}{year_line}<{heading} class="public-entry">{e(work["title"])}</{heading}>
      {description}<div class="work-card-bottom">{availability}
      <span class="work-link" aria-hidden="true">→</span></div>
    </a>'''


def shell(title, path, content):
    return f'''<!doctype html>
<html data-visual="site" data-public-visual lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>{e(title)} · Sheen Yang</title>
  <link rel="canonical" href="https://sheenyang.com{path}">
  <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#121518" media="(prefers-color-scheme: dark)">
  <link rel="stylesheet" href="/assets/site-visual.css">
  <link rel="stylesheet" href="/assets/site-navigation.css">
  <link rel="stylesheet" href="/works/works.css">
  <script src="/assets/site-analytics.js" defer></script>
  <script src="/assets/site-language.js" defer></script>
  <script src="/assets/site-navigation.js" defer></script>
  <script src="/works/works.js" defer></script>
</head>
<body>
<header class="topbar" data-site-navigation>
  <div class="shell topbar-inner">
    <a class="brand" href="/">Sheen Yang</a>
    <button class="menu-button" id="menuButton" type="button" aria-label="打开菜单" aria-expanded="false" aria-controls="menuPanel"><span class="menu-icon" aria-hidden="true"><span></span></span></button>
  </div>
</header>
<div class="menu-panel" id="menuPanel" data-site-navigation aria-hidden="true" inert>
  <div class="menu-inner"><nav class="menu-links" aria-label="网站导航">
    <a href="/" data-nav-section="home">首页</a>
    <a href="/scores/" data-nav-section="scores">乐谱</a>
    <a href="/courses/" data-nav-section="courses">课程</a>
    <a href="/articles/" data-nav-section="articles">文章</a>
    <a href="/works/" data-nav-section="works">作品</a>
    <a href="/#contact" data-nav-section="contact">联系</a>
  </nav></div>
</div>
{content}
<footer class="visual-footer"><div class="shell">© 2026 Sheen Yang, All rights reserved.</div></footer>
</body>
</html>
'''


def detail(work, works):
    year = f'<p class="work-year">{e(work["year"])}</p>' if work.get("year") else ""
    description = f'<div class="work-description">{text(work["description"])}</div>' if work.get("description") else ""
    audio = f'''<section class="work-media" aria-labelledby="audioHeading">
      <h2 id="audioHeading" class="public-section">{labels("聆听", "Listen")}</h2>
      <audio controls preload="none" aria-label="{e(work["title"])}"><source src="{e(work["audio"])}" type="audio/mpeg"></audio>
    </section>''' if work.get("audio") else ""
    score = f'''<section class="work-media" aria-labelledby="scoreHeading">
      <h2 id="scoreHeading" class="public-section">{labels("乐谱预览", "Score preview")}</h2>
      <div class="score-actions">
        <button class="site-cta site-cta-compact" type="button" data-score-src="{e(work['score'])}" data-score-title="{e(work['title'])}" aria-expanded="false" aria-controls="scoreFrame">{labels("在线预览乐谱", "Preview score")} <span aria-hidden="true">⌄</span></button>
        <a class="score-window-link" href="{e(work['score'])}#toolbar=0&navpanes=0" target="_blank" rel="noopener">{labels("新窗口查看", "Open in a new window")} <span aria-hidden="true">↗</span></a>
      </div>
      <div class="score-frame" id="scoreFrame" hidden></div>
    </section>''' if score_visible(work) else ""
    credits = ""
    if work.get("credits"):
        entries = "".join(f'<div><dt>{text(c["role"])}</dt><dd>{text(c["name"])}</dd></div>' for c in work["credits"])
        credits = f'<section class="work-media"><h2 class="public-section">Credits</h2><dl class="work-credits">{entries}</dl></section>'
    video = f'<section class="work-media"><h2 class="public-section">{labels("视频", "Video")}</h2><video controls playsinline preload="none" src="{e(work["video"])}"></video></section>' if work.get("video") else ""
    others = [w for w in works if w["id"] != work["id"] and w["category"] == work["category"]][:2]
    related = "".join(card(w) for w in others)
    return shell(work["title"], url(work), f'''<main class="shell work-detail">
    <a class="work-back" href="/works/">← {labels("返回作品", "Back to Works")}</a>
    <div class="work-heading"><p class="work-category">{category(work)}</p><h1 class="public-title">{e(work['title'])}</h1>{year}{description}</div>
    {audio}{score}{credits}{video}
    <section class="other-works"><h2 class="public-section">{labels("其他作品", "Other works")}</h2><div class="works-grid">{related}</div><a class="work-back" href="/works/">{labels("查看全部作品", "View all works")} →</a></section>
  </main>''')


def build():
    works = json.loads((ROOT / "data/works.json").read_text())
    slugs, ids = set(), set()
    for work in works:
        assert work["category"] in CATEGORIES
        assert re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", work["slug"])
        assert work["slug"] not in slugs and work["id"] not in ids, "Duplicate slug/id"
        slugs.add(work["slug"]); ids.add(work["id"])
        assert work.get("scoreMode") in ("preview", "hidden")
        assert work["title"] == unicodedata.normalize("NFC", work["title"])
        for key in ("audio", "score", "video", "thumbnail"):
            asset = work.get(key)
            if key == "score" and not score_visible(work):
                continue
            if asset:
                assert asset.startswith(f'/works/{work["slug"]}/assets/') and ".." not in asset
                assert (ROOT / asset.lstrip("/")).is_file(), f"Missing {asset}"
    works.sort(key=lambda w: (list(CATEGORIES).index(w["category"]), w.get("order", 0)))
    sections = ""
    for key, names in CATEGORIES.items():
        cards = "".join(card(w) for w in works if w["category"] == key)
        legacy_anchor = '<span id="transcription" aria-hidden="true"></span>' if key == "transcription" else ""
        sections += f'<section class="works-section" id="{ANCHORS[key]}" aria-labelledby="{key}Heading">{legacy_anchor}<h2 id="{key}Heading" class="public-section">{labels(*names)}</h2><div class="works-grid">{cards}</div></section>'
    intro = ('<p class="works-intro">' + labels("在线试听 · 乐谱预览", "Listen online · Preview scores") + '</p>'
             if all(w.get("audio") and score_visible(w) for w in works) else "")
    overview = shell("作品", "/works/", f'''<main class="shell works-main">
    <div class="works-heading"><p class="work-eyebrow">Portfolio</p><h1 class="public-title">{labels("作品", "Works")}</h1>{intro}</div>
    <nav class="works-jumps" aria-label="作品类别"><a href="#original">{labels(*CATEGORIES['original'])} ↓</a><a href="#transcriptions">{labels(*CATEGORIES['transcription'])} ↓</a></nav>
    {sections}</main>''')
    (ROOT / "works/index.html").write_text(overview)
    for work in works:
        folder = ROOT / "works" / work["slug"]
        folder.mkdir(exist_ok=True)
        (folder / "index.html").write_text(detail(work, works))
    scores_path = ROOT / "scores/index.html"
    scores = scores_path.read_text()
    start, end = "<!-- WORKS FREE SCORES START -->", "<!-- WORKS FREE SCORES END -->"
    entrances = {"original": "原创作品", "transcription": "扒谱作品"}
    entries = ""
    for key, title in entrances.items():
        count = sum(w["category"] == key and score_visible(w) for w in works)
        if count:
            entries += f'''    <a class="score-card" href="/works/#{ANCHORS[key]}">
      <span class="eyebrow">PORTFOLIO</span><h3 class="public-entry">{e(title)}<span class="score-card-subtitle" lang="en">{e(CATEGORIES[key][1])}</span></h3>
      <p class="score-card-meta">{count} 首</p>
      <span class="score-card-action"><span aria-hidden="true">→</span></span>
    </a>
'''
    block = f'{start}\n{entries}\n{end}'
    assert scores.count(start) == scores.count(end) == 1
    scores = re.sub(re.escape(start) + r".*?" + re.escape(end), lambda _: block, scores, flags=re.S)
    scores_path.write_text(scores)
    print(f"Generated Works overview, {len(works)} canonical pages and Free Scores entrances.")


if __name__ == "__main__":
    build()
