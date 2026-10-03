# Shared visual foundation

`site-visual.css` is loaded **after** each page's existing styles. It provides
system sans-serif typography, white Light Mode, OS-driven Dark Mode, focus
outlines and a 1,200 ms opacity-only page entrance. No font downloads, theme
storage, theme toggle, global JavaScript or changes to application logic are
required. Reduced-motion preferences disable the entrance animation.

Each HTML root has a `data-visual` adapter:

| Value | Existing pages |
| --- | --- |
| `site` | Homepage, scores/product, courses, articles, works |
| `legacy` | `index-old.html`, including its existing language gate |
| `ear-simple` | ET-Intervals 01/02 quizzes |
| `ear` | ET-Intervals 03–18 singing applications |
| `learning` | MT-Intervals lessons 01/02 Learning |
| `practice` | MT-Intervals practice 01/02 and lessons 03/04/05 Quiz |

To add a page, choose the appropriate adapter and reference this stylesheet
using a relative path from that page. Use `var(--site-font)` for UI font
families and `--site-*` tokens for new UI colors. Existing layout, responsive
rules, application state classes and business scripts remain page-owned.
Theme-aware `theme-color` metadata uses the same page backgrounds for browser
chrome. Font rendering depends on installed system fonts; SF Pro and PingFang
are never bundled.

## Teaching boundaries

Learning's `.lesson-board`, `.staff`, `.stage`, `.keyboard` and
`.compact-keyboard`, and Practice's `.staff-question`, retain the original
local teaching tokens and light color scheme. The shared layer does not set
SVG fills/strokes, piano-key colors, image filters, notation fonts or pitch
meter colors. Keep diagrams inside these existing boundaries; for a new
teaching component, inspect its own palette before adding a targeted boundary.
Correct/error feedback adapts to readable green/red UI tints; its meaning and
application state classes remain unchanged.

The shared entrance uses opacity on the body. The experimental homepage uses
separate CSS entrances for its static sections and Hero details: 120 ms steps,
up to 360 ms delay, ending at 1,560 ms. Only Hero text details move (6 px);
menus and fixed page roots do not. Reduced motion disables every entrance.
Avoid transforms on page roots:
they can relocate fixed lesson controls, menus and purchase sheets. Do not
add visibility gates that depend on JavaScript or animate question changes.

## Validation when extending

Check desktop, portrait and short landscape under both color schemes. Exercise
reduced motion and JavaScript-disabled rendering. Validate representative
Learning boards, notation, piano keys, correct/error feedback, answer gates,
audio, results/history and purchase form validation without submitting orders.
Compare teaching colors with the previous version and measure layout shifts.
