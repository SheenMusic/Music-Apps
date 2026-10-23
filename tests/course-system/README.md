# Unified course design acceptance

## ET03–18 concise rules and harmonic assistance

```bash
HARMONIC_SCREENSHOTS=/tmp/harmonic-practice node --test tests/course-system/harmonic-practice.test.cjs
node --test tests/course-system/harmonic-audio.test.cjs
node --test tests/course-system/pitch-disclosure.test.cjs
```

The practice suite checks shared rules/layout, source/ID/parameter preservation, the ET04 strict octave policy, compound interval modes and all seven harmonic lessons' final-ten-only eligibility/reports using simulated singing. The audio suite separately protects deployed HTML/rules/report logic and verifies 6.5 Hz / five one-sided decaying ripples (first peak 15 cents), independent relative +30% gain, continuous retriggers, unchanged piano harmonics, 4.5-second natural decay with a two-second time constant, a one-second raised-cosine release, and exact silence at 5.5 seconds. The ripple/boost envelope follows `interval_fm_lab_ripple_am.html`'s `(1-u)^1.15` curve with first-peak normalization and a smooth gain attack. Real OfflineAudioContext checks pitch, amplitude, continuity and clipping; native AudioContext checks rapid taps/replay and cleanup. Device microphones, listening quality and mobile Safari still require device checks.

The pitch-disclosure suite continues checking the seven melodic construction lessons. Native disclosure and concise display strings are intentional changes; historical CSS-only DOM/script equality gates below describe the earlier migration and do not apply to this feature. Their historical baselines remain unchanged.

This suite validates the new course design, not historical PNG equality. The historical course-baseline visual/raster/review tests and evidence remain available for their original Phase 1 contract; they are not acceptance gates for the unified design.

```bash
node --test tests/course-baseline/baseline.test.cjs tests/course-baseline/isolation.test.cjs
COURSE_DESIGN_OUTPUT=/tmp/course-unification/complete node --test tests/course-system/system.test.cjs
```

The immutable teaching source is integration commit `9a4ae6b260feb4f25605bbf2ba335b116241d52a`: every course body, inline script and external course JavaScript must remain identical. Only the HTML root opt-in and stylesheet links/blocks may change. The original three-course behavior contract still reads the fixed Phase 0 source. Non-course modules are hashed against the integration starting commit; scope protection is not removed.

All 26 pages are exercised at 320×812, 390×844, 430×932, 768×1024, 1024×768 and 1280×900, in Light/Dark. States include initial, ET playback/recording/report, ET01/02 quiz, all Learning steps/modules and completion, and Practice question/nav; all five Practice question banks are checked and answered completely on desktop. Audio and microphone use the existing test doubles. ET report layout uses original success handlers, not a reimplemented judge. A fixed-seed test-only random sequence avoids deadlocking the ET03/04 original anti-repeat generator with the legacy constant random mock.

Assertions cover zero page overflow, native theme background, 8px ordinary cards, 44px ordinary touch targets, untruncated button text and actual painted button overlap. A scrollable ancestor's clip is accounted for: content outside its visible area is not a visible collision; teaching islands and intentionally scrollable music keyboards retain their own dimensions. Browser/page/resource errors fail. Screenshots are current-design artifacts for inspection only and remain in the output directory; no old PNG hashing, raster classification or approval mechanism is used.

Source protection proves unexercised question text, algorithms and storage code were not changed. These checks do not replace real microphone permissions, sound quality, human singing, Safari or hardware orientation tests. Known Phase 0 TODOs remain documented separately.
