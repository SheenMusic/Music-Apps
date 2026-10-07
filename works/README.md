# Portfolio maintenance

`data/works.json` is the single source of truth for Works and the Portfolio
entries in Scores. Each work has one `/works/[slug]/` page and one assets folder.

1. Add reviewed public copies to `works/[slug]/assets/`.
2. Add/update the JSON record. Normalize titles to NFC. Keep IDs and published
   slugs stable. Do not infer years, descriptions or credits from filenames.
3. Run `python3 scripts/build-works.py` from the repository root.
4. Review the generated pages and Scores block; verify media and responsive UI.
5. Commit only the reviewed files, then publish through the existing workflow.

The generator intentionally has no dependencies or workflow integration. It
only writes Works HTML and the marked Portfolio block in `scores/index.html`.
Existing Scores publications, payment/consent behavior and other sections remain
owned by their existing pages.

## Metadata

- Required: `id`, `slug`, `title`, `category` (`original` / `transcription`), `order`.
- `audio`, `score`: same-work public asset paths.
- `scoreMode`: `preview` displays online preview and adds the Scores entrance;
  `hidden` omits score links, viewer and the Scores entrance. To unpublish an
  already-public PDF, also remove it from the public assets in a separately
  authorized change. Hiding UI alone does not revoke direct URL access.
- Optional: `year`, `description`, `credits`, `video`, `thumbnail`. Empty values
  render no section. Description may be a string or `{ "zh": "...", "en": "..." }`.
- Credits entries use `role` / `name`; strings or localized objects are accepted.

Current policy is Audio + Free Score Preview, with no PDF download UI. Native
browser PDF viewers can still expose saving controls; toolbar URL hints are not
access control. No claims of download prevention are made.

Keep master assets, `.sib`, CV files, `.pages`, Finder metadata and private
source-to-public mappings outside this repository. Pages deploys the site root.
