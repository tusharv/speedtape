# Speedtape Signal Ledger landing redesign

**Status:** Approved. Ready for implementation planning.

**Date:** 2026-08-14

## Purpose

The current landing page is functional but visually plain. It has a restrained teal and zinc palette, clear developer-focused copy, an interactive 24-hour tape, and sound information architecture. It lacks a recognizable logo, a strong hero composition, and a visual system that carries through the full page.

This redesign gives Speedtape a professional, ownable identity without changing routes, product behavior, or the existing developer-tool character.

## Approved direction

Use the **Signal Ledger** direction selected in the visual companion.

- Preserve the teal, zinc, and system light/dark identity.
- Add a compact signal-bar mark beside the Speedtape wordmark.
- Use `Know your line.` as the hero headline.
- Make the real interactive 24-hour tape the hero's main visual.
- Apply the signal-bar motif sparingly across section transitions, focus states, and the footer.
- Keep the composition precise and instrument-like, not playful or decorative.

Design read: a targeted landing-page evolution for developers and home-network enthusiasts, with a precise utility-forward language.

Design dials:

| Dial | Value | Reason |
| --- | ---: | --- |
| Design variance | 7 | Asymmetric enough to feel designed while remaining practical. |
| Motion intensity | 4 | Subtle entry and interaction feedback without cinematic effects. |
| Visual density | 4 | Compact developer-tool content with enough space for hierarchy. |

## Alternatives considered

### Continuous Tape

A loop mark and full-width signal ribbon make the tape metaphor more expressive. This direction is memorable, but its decorative emphasis competes with the real tape visualization.

### Home Signal

A house-and-bars mark and network rings make the product purpose immediately friendly. This direction is approachable, but it feels less credible as a monitoring instrument.

### Signal Ledger

A compact bar mark, asymmetric hero, and instrument-framed tape balance identity with clarity. This is the approved direction.

## Identity system

### Logo

Create a reusable `BrandMark` component made from three ascending vertical signal bars inside the project's existing 8px radius system. It is a simple geometric mark explicitly created for Speedtape, not a generic icon-library glyph.

Create a `BrandLockup` that places the mark beside the readable `Speedtape` name. The mark is decorative inside the lockup and uses `aria-hidden="true"`; the visible name carries the accessible meaning.

Use the lockup in the landing header and footer. The mark may also become the application icon if the installed Next.js version supports the chosen metadata file convention.

### Color and shape

Keep the existing semantic color tokens and system theme behavior:

- Light background: zinc-50.
- Dark background: zinc-950.
- Accent: teal-700 in light mode and teal-400 in dark mode.
- Text, muted text, panel, line, and failure colors continue using the existing tokens.
- Panels, buttons, and the logo container use the existing 8px radius scale.

The page uses one theme at a time. Sections may use nearby surface tones but must not flip between light and dark themes.

### Typography

Keep Geist and Geist Mono through `next/font`.

- Display copy uses Geist semibold with tight tracking.
- Commands, measurements, and tape readouts use Geist Mono.
- Body copy stays concise and functional.
- Page copy contains no em dash or en dash characters.

## Page composition

### Header

Keep the navigation on one line at desktop and below 80px tall.

- Left: Speedtape brand lockup linked to `/`.
- Right: `View on GitHub` and `Open dashboard`.
- `Open dashboard` remains the single primary action.
- Existing URLs and labels remain stable.

### Hero

Use an asymmetric two-column layout at 768px and above. Stack it into one column below 768px.

Left column:

- Optional functional label: `Local network monitor`.
- Headline: `Know your line.`
- Supporting sentence: `A continuous record of download, upload, and ping from the Mac in your house.`
- Primary action: `Open dashboard`.

Right column:

- The existing `LandingTape` component using `landingTapeCells()`.
- A semantic instrument panel with a short label such as `24 hour signal`.
- No fake dashboard screenshot, stock image, decorative status dot, scroll cue, or version label.

The headline must remain no more than two lines and the primary action must be visible without scrolling at common desktop viewport heights.

### How it runs

Keep the existing command content and copy-to-clipboard behavior. Recompose it as a compact command rail with clear separation between the human-readable action and the command.

- Use one section heading and one short supporting paragraph.
- Do not add generic step numbers.
- Provide visible copied, copy-failed, keyboard-focus, hover, and active states.
- Preserve the current command order and command strings.

### Background operation

Keep the current four benefits and their meaning:

- This Mac only.
- Ookla Speedtest CLI.
- SQLite on disk.
- Tape, chart, runs.

Replace the plain definition list with an asymmetric system ledger. One dominant statement explains that the Mac keeps the record; the supporting facts sit in a balanced two-column structure at desktop and a single column on mobile.

Do not convert the content into three equal feature cards. Use spacing, restrained borders, and small functional signal motifs to create hierarchy.

### Footer

Use the brand lockup, MIT label, GitHub link, and dashboard link. Avoid version labels, locale strips, and duplicate calls to action.

## Components and boundaries

| Unit | Responsibility | Dependencies |
| --- | --- | --- |
| `BrandMark` | Render the reusable geometric signal mark | Existing color and radius tokens |
| `BrandLockup` | Combine the mark with the readable Speedtape name | `BrandMark`, `APP_NAME`, `next/link` when linked |
| `LandingTape` | Preserve the current interactive sample tape behavior | `lib/landing-tape`, `lib/tape` |
| `LandingCommands` | Preserve commands and add explicit success/failure feedback | Clipboard API, Phosphor icons |
| `app/page.tsx` | Compose the landing sections and stable actions | Brand components, tape, commands, site constants |
| `app/globals.css` | Provide tokens and restrained entry/interaction motion | System color and motion preferences |

The logo components should remain small and reusable. Page-specific layout stays in the landing page unless an existing shared pattern already fits.

## Data and behavior

The landing page stays static and must not open SQLite.

1. `landingTapeCells()` provides fixed sample cells.
2. `LandingTape` renders the sample as the interactive hero instrument.
3. Pointer and keyboard interactions update the selected hour readout locally.
4. `LandingCommands` writes only the selected command to the clipboard and shows transient feedback.

No database, schedule, run, or dashboard logic changes are in scope.

## Error handling

- Clipboard success shows an explicit `Copied` state for the selected command.
- Clipboard failure shows a short inline `Copy failed` state and leaves the command visible for manual selection.
- The feedback must not rely only on color or an icon.
- If client-side JavaScript is unavailable, commands remain readable even though copying and tape interaction are unavailable.

## Accessibility

- Keep the existing `LandingTape` slider semantics, keyboard commands, and readable value output.
- Decorative logo geometry is hidden from assistive technology inside the lockup.
- All interactive elements have visible focus states.
- Button and text contrast meet WCAG AA in light and dark themes.
- Motion above simple state transitions is gated by `prefers-reduced-motion`.
- Mobile layouts use full-width single-column fallbacks and preserve readable command wrapping.

## Motion

Motion communicates hierarchy and interaction feedback only.

- Tape bars retain their staggered rise on entry.
- Hero text and panel may use a brief opacity and translate entrance using CSS.
- Buttons use small hover and active transforms.
- Copied state changes immediately and clearly.
- Animate only opacity and transforms.
- Under reduced motion, all entrance animation becomes static and interaction feedback remains understandable.

## Testing and verification

Use Vitest and the existing React component test style.

- Add a component test for the brand lockup's readable name and accessible link behavior.
- Update landing-page/component assertions for the new hero headline and primary action where coverage exists.
- Add or update `LandingCommands` tests for copied and copy-failed text if the component is made testable in the current environment.
- Keep all existing tape keyboard and readout tests passing.
- Run the complete test suite, lint, and production build.
- Inspect the landing page in a browser at desktop and mobile widths.
- Verify system light and dark themes.
- Verify keyboard focus, tape interaction, copied state, and reduced motion.
- Check for horizontal overflow at 320px width.
- Run Lighthouse or an equivalent browser audit for obvious accessibility and performance regressions.

## Pre-flight constraints

- One accent color across the page.
- One 8px radius system.
- One page theme at a time.
- No em dash or en dash in visible copy.
- No generic three-card feature row.
- No fake product screenshots.
- No decorative status dots, scroll cues, version labels, or locale strips.
- No duplicated primary call-to-action intent.
- Navigation remains one line on desktop and below 80px tall.
- All multi-column layouts define a single-column mobile fallback.
- Any new icons use the existing Phosphor family. The explicit geometric brand mark is the only custom vector exception.

## Out of scope

- Dashboard, runs, configuration, database, scheduling, or agent behavior changes.
- URL or navigation-label changes.
- Replacing Geist or changing the teal brand color.
- A full marketing-site content rewrite.
- Analytics or GitHub repository changes.
- Advanced scroll effects, marquees, WebGL, or a new animation dependency.
