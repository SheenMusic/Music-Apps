# Public-page language state

`site-language.js` runs before `site-navigation.js` on public pages only.
Supported preferences: `zh`, `en`; storage key: `sheen-lang`.
Valid URL `lang` overrides everything. Otherwise `/` selects Chinese,
`/en/` selects English, and ordinary pages use the stored preference or Chinese.
No browser-language or referrer detection. Storage failure leaves URL switching usable.

Ordinary pages share their current URL: English adds `lang=en`; switching to
Chinese removes only `lang`, preserving other query parameters and anchors.
Homepage switching keeps the two existing homepage paths. Same-origin public
HTML links inherit language; PDFs, media, payment links and student Apps do not.

## Adding English to a page

Keep independently written blocks within the same main element:

```html
<main>
  <div data-content-lang="zh">中文内容，可以有自己的结构与链接。</div>
  <div data-content-lang="en" hidden inert>Independent English content.</div>
</main>
```

An English block indicates the page has English content. Wrap all language-specific
body content in the appropriate blocks; do not mark a translated fragment as a
complete English page. The two blocks need not mirror each other. Shared components
can stay outside the blocks. Hidden blocks use `hidden` and `inert`, including their
controls. With JS disabled, Chinese remains readable by default.

Until a page has an English block, English preference keeps the Chinese body with
one quiet English progress note. Document language describes the body actually
shown; `html[data-site-language]` records the preference separately.

No Teaching App, unlisted URL or legacy homepage should load this script.
