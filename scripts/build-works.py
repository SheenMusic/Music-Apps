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
CATEGORIES = {"original": ("原创器乐", "Original Music"),
              "arrangement": ("改编作品", "Arrangements"),
              "transcription": ("扒谱作品", "Transcriptions"),
              "orchestration": ("配器作品", "Orchestration")}
ANCHORS = {"original": "original", "arrangement": "arrangements",
           "transcription": "transcriptions", "orchestration": "orchestration"}



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


def compact_metadata(work):
    parts = [work["projectType"]] if work.get("projectType") else list(work.get("genres", []))
    if work.get("year") and work["category"] != "transcription":
        parts.append(str(work["year"]))
    if work.get("duration"):
        parts.append(work["duration"])
    meta = f'<p class="work-meta">{e(" · ".join(parts))}</p>' if parts else ""
    instruments = work.get("instrumentation", [])
    if instruments:
        meta += f'<p class="work-instruments">{e(" · ".join(instruments))}</p>'
    return meta


def secondary_title(work):
    return f'<p class="work-secondary-title">{e(work["secondaryTitle"])}</p>' if work.get("secondaryTitle") else ""


def performer(work):
    return next((c["name"] for c in work.get("credits", []) if c["role"] == "Performed by"), "")


def source_intro(work):
    if not work.get("projectType"):
        return ""
    parts = [work.get("source", {}).get("description", ""), performer(work)]
    value = " · ".join(p for p in parts if p)
    return f'<p class="work-source">{e(value)}</p>' if value else ""


def card(work, heading="h3"):
    media = []
    if work.get("audio"):
        media.append(labels("试听", "Audio"))
    if score_visible(work):
        media.append(labels("乐谱预览", "Score preview"))
    if work.get("video"):
        media.append(labels("视频", "Video"))
    availability = " · ".join(media)
    if work.get("projectType"):
        summary = f'<p class="work-source">{e(performer(work))}</p>' if performer(work) else ""
        meta_parts = [work["projectType"]] + ([work["duration"]] if work.get("duration") else [])
        meta = f'<p class="work-meta">{e(" · ".join(meta_parts))}</p>'
        return f'''<a class="work-card" href="{url(work)}">
          <{heading} class="public-entry">{e(work["title"])}</{heading}>
          {secondary_title(work)}{meta}{summary}
          <div class="work-card-bottom"><span class="work-link">{labels("查看作品", "View work")} <span aria-hidden="true">→</span></span></div>
        </a>'''
    return f'''<a class="work-card" href="{url(work)}">
      <{heading} class="public-entry">{e(work["title"])}</{heading}>
      {compact_metadata(work)}<div class="work-card-bottom"><span class="work-availability">{availability}</span>
      <span class="work-link">{labels("查看作品", "View work")} <span aria-hidden="true">→</span></span></div>
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
    production = ""
    notes = []
    if work.get("roles"):
        notes.append(f'<p>{e(" · ".join(work["roles"]))}</p>')
    if work.get("productionDate"):
        notes.append(f'<p>{labels("制作", "Produced")} · {e(work["productionDate"])}</p>')
    if work.get("soundLibraries"):
        notes.append(f'<p>{labels("音源", "Sound libraries")} · {e(" · ".join(work["soundLibraries"]))}</p>')
    if notes:
        production = '<aside class="work-production">' + "".join(notes) + '</aside>'

    description = f'<div class="work-description">{text(work["description"])}</div>' if work.get("description") else ""
    if work.get("projectType") and isinstance(work.get("description"), str) and work["description"]:
        paragraphs = "".join(f'<p>{e(part)}</p>' for part in work["description"].split("\n\n"))
        description = f'<div class="work-description work-description-paragraphs" lang="en">{paragraphs}</div>'
    audio = f'''<section class="work-media" aria-labelledby="audioHeading">
      <h2 id="audioHeading" class="visually-hidden">{labels("聆听", "Listen")}</h2>
      <audio controls preload="none" aria-label="{e(work["title"])}"><source src="{e(work["audio"])}" type="audio/mpeg"></audio>
    </section>''' if work.get("audio") else ""
    score = f'''<section class="work-media" aria-labelledby="scoreHeading">
      <h2 id="scoreHeading" class="public-section">{labels("乐谱", "Score")}</h2>
      <div class="score-actions">
        <button class="site-cta site-cta-compact" type="button" data-score-src="{e(work['score'])}" data-score-title="{e(work['title'])}" aria-expanded="false" aria-controls="scoreFrame">{labels("在线预览乐谱", "Preview score")} <span aria-hidden="true">⌄</span></button>
        <a class="score-window-link" href="{e(work['score'])}#toolbar=0&navpanes=0" target="_blank" rel="noopener">{labels("新窗口查看", "Open in a new window")} <span aria-hidden="true">↗</span></a>
      </div>
      <div class="score-frame" id="scoreFrame" hidden></div>
    </section>''' if score_visible(work) else ""
    credits = ""
    if work.get("projectType"):
        lines = []
        if work.get("originalArtist"):
            lines.append(("Original Artist", work["originalArtist"]))
        lines.extend((c["role"], c["name"]) for c in work.get("credits", []))
        if work.get("scope"):
            lines.append(("Scope", work["scope"]))
        source = work.get("source", {})
        if source.get("description"):
            lines.append(("Source", source["description"]))
        if source.get("performanceDate"):
            lines.append(("Source Performance Date", source["performanceDate"]))
        credits = '<aside class="work-source-credits" aria-label="Credits and source">' + "".join(
            f'<p><span class="credit-label">{e(role)}</span> · {e(value)}</p>' for role, value in lines) + '</aside>'
    elif work.get("credits"):
        entries = "".join(f'<div><dt>{text(c["role"])}</dt><dd>{text(c["name"])}</dd></div>' for c in work["credits"])
        credits = f'<section class="work-media"><h2 class="public-section">Credits</h2><dl class="work-credits">{entries}</dl></section>'
    video = f'<section class="work-media"><h2 class="public-section">{labels("视频", "Video")}</h2><video controls playsinline preload="none" src="{e(work["video"])}"></video></section>' if work.get("video") else ""
    others = [w for w in works if w["id"] != work["id"] and w["category"] == work["category"]][:2]
    related = "".join(card(w) for w in others)
    return shell(work["title"], url(work), f'''<main class="shell work-detail">
    <a class="work-back" href="/works/#{ANCHORS[work["category"]]}">← Portfolio</a>
    <div class="work-heading"><h1 class="public-title">{e(work['title'])}</h1>{secondary_title(work)}{compact_metadata(work)}{source_intro(work)}{description}</div>
    {audio}{score}{production}{credits}{video}
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
        for field in ("secondaryTitle", "projectType"):
            if work.get(field):
                assert work[field] == unicodedata.normalize("NFC", work[field])
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
        selected = [w for w in works if w["category"] == key]
        cards = "".join(card(w) for w in selected)
        count = f'<span class="category-count">{labels(f"{len(selected)} 首作品", f"{len(selected)} Works")}</span>' if selected else ""
        empty_en = "Selected arrangements will be added here." if key == "arrangement" else "Selected orchestration work will be added here."
        content = f'<div class="works-grid">{cards}</div>' if selected else f'<p class="category-empty">{labels("作品将陆续加入。", empty_en)}</p>'
        anchor = ANCHORS[key]
        legacy = '<span id="transcription" aria-hidden="true"></span>' if key == "transcription" else ""
        sections += f'''<details class="works-category" id="{anchor}">
          <summary class="category-card" id="{anchor}Heading" role="button" aria-expanded="false" aria-controls="{anchor}Panel">
            <span class="category-label"><span class="work-eyebrow" lang="en">{e(names[1])}</span><span class="category-title">{labels(*names)}</span>{count}</span>
            <span class="category-indicator" aria-hidden="true"></span>
          </summary>
          {legacy}<div class="category-content" id="{anchor}Panel" role="region" aria-labelledby="{anchor}Heading">{content}</div>
        </details>'''
    overview = shell("作品", "/works/", f'''<main class="shell works-main">
    <div class="works-heading"><p class="work-eyebrow">Portfolio</p><h1 class="public-title">{labels("作品", "Works")}</h1>
    <p class="works-intro">{labels("我的音乐创作、改编、扒谱与配器作品。", "My original music, arrangements, transcriptions and orchestration work.")}</p></div>
    <div class="works-categories">{sections}</div></main>''')
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
      <span class="eyebrow">PORTFOLIO</span><h3 class="public-entry">{e(title)}<span class="score-card-subtitle" lang="en">{e("Original Works" if key == "original" else CATEGORIES[key][1])}</span></h3>
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
