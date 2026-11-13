---
name: Suminagashi Ink Basin
description: A sheet of marbling paper; one live basin of indigo ink beside a still margin of plain facts.
colors:
  indigo: "#0a1a33"
  current: "#1e2d4a"
  dilute: "#55627a"
  feather: "#aeb6c2"
  mist: "#dde2e8"
  paper-deep: "#eceff3"
  paper: "#f6f7f9"
typography:
  display:
    fontFamily: "Alegreya Sans, Gill Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(3.4rem, 7.4vw, 6rem)"
    fontWeight: 300
    lineHeight: 0.95
    letterSpacing: "-0.035em"
  display-close:
    fontFamily: "Alegreya Sans, Gill Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(3rem, 6vw, 5.4rem)"
    fontWeight: 300
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Alegreya Sans, Gill Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.3rem, 3.6vw, 3.4rem)"
    fontWeight: 300
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Alegreya Sans, Gill Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 2vw, 2rem)"
    fontWeight: 300
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title-entry:
    fontFamily: "Alegreya Sans, Gill Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 2vw, 1.9rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  lede:
    fontFamily: "Alegreya Sans, Gill Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.15rem, 0.6vw + 1rem, 1.4rem)"
    fontWeight: 400
    lineHeight: 1.45
  quote:
    fontFamily: "Alegreya Sans, Gill Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.2rem, 1.2vw + 0.8rem, 1.45rem)"
    fontWeight: 400
    lineHeight: 1.4
  body:
    fontFamily: "Alegreya Sans, Gill Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(17px, 0.35vw + 15.5px, 19px)"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Alegreya Sans, Gill Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.55
  button:
    fontFamily: "Alegreya Sans, Gill Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.01em"
rounded:
  sm: "6px"
  drop: "50%"
spacing:
  gutter: "clamp(20px, 5vw, 72px)"
  content-max: "1280px"
  section: "clamp(88px, 11vw, 152px)"
  section-head: "clamp(36px, 5vw, 56px)"
  column-gap: "clamp(28px, 4vw, 56px)"
  masthead: "72px"
components:
  button-ink:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.paper}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 1.4em"
    height: "48px"
  button-ink-hover:
    backgroundColor: "{colors.current}"
    textColor: "{colors.paper}"
  button-line:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.indigo}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 1.4em"
    height: "48px"
  button-line-hover:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.paper}"
  button-small:
    padding: "0 1.1em"
    height: "40px"
  copy-button:
    backgroundColor: "transparent"
    textColor: "{colors.indigo}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "40px"
  copy-button-done:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.paper}"
  nav-link:
    textColor: "{colors.dilute}"
    padding: "6px 0"
  nav-link-active:
    textColor: "{colors.indigo}"
  toast:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "12px 18px"
---

# Design System: Suminagashi Ink Basin

## Overview

**Creative North Star: "The Marbling Sheet"**

The page is a sheet of suminagashi paper. One live basin of indigo ink floats on paper-white water, and beside it sits a still margin of plain facts set in light humanist sans. The ink is computed, not painted: the opening pattern is a list of marbling operations (ink drops, water drops, a wave, the comb's tines) undone per pixel so every line stays crisp, after which a small fluid simulation lets the visitor stir the water and drop fresh ink.

Everything outside the basin is quiet. Structure comes from 1px hairlines, ink depth and type weight, never from cards, shadows or tinted panels. The palette is a single indigo family stepped from paper to deep ink, so the page reads as one material. Density is low and the rhythm is generous; the margin holds only what a reader needs to decide.

The world rejects the dark neon developer portfolio and the split hero with a row of icon cards. It also rejects gradients used as chrome and glow of any kind.

**Key Characteristics:**
- One live ink basin per page; the rest of the sheet is still paper.
- A single indigo hue family from paper (#f6f7f9) to deep ink (#0a1a33); no second hue.
- Light display type (300) with negative tracking; emphasis by weight 500, not colour.
- Hairline structure (1px mist or indigo rules); no shadows anywhere.
- Recency shown by ink depth: the newest thing is the darkest.
- Placeholder imagery is a print pulled from the basin, never stock.

## Colors

One ink, diluted: every colour is the same cool indigo at a different strength, from water to the darkest drop.

### Primary
- **Basin Indigo** (indigo): the darkest ink. Body text, headings, the primary button, focus rings, selection, the newest experience entry and the newest drop in the basin. The shader's INDIGO constant mirrors it exactly.
- **Current** (current): ink one step lighter. Hover state of the primary button, running prose (lede, project and entry copy, quotes) and the second experience entry.

### Secondary
- **Dilute Ink** (dilute): the faded ink. Secondary text (nav at rest, meta lines, labels, captions, footer) and the oldest experience entry. In the shader it is the light end of the ink ramp (DILUTE), so faded marbling lines and secondary type share one value.

### Neutral
- **Feather** (feather): link underlines at rest, the scrollbar thumb and the placeholder's dashed edge. Never used for text.
- **Mist** (mist): every structural hairline: section rules, list dividers, the scrolled masthead's bottom edge, the phone dock's top edge, the copy button's resting border.
- **Paper Deep** (paper-deep): the recessed ground behind project prints and the headshot slot.
- **Paper** (paper): the water and the sheet. Page ground, the scrolled masthead, the mobile menu, text on ink. The shader's PAPER constant mirrors it.

### Named Rules
**The One Ink Rule.** Every colour on the page is the indigo family above. A new surface adds no hue; it picks a strength of the same ink.

**The Shader Mirror Rule.** The CSS custom properties (--paper, --dilute, --indigo) and the shader constants (PAPER, DILUTE, INDIGO in main.js) are one source told twice. Change one and you change the other.

## Typography

**Display Font:** Alegreya Sans (with Gill Sans, Segoe UI, system-ui), self-hosted at 300, 400, 400 italic, 500, 700
**Body Font:** Alegreya Sans, same stack

**Character:** A calligraphic humanist sans: at weight 300 the display has the thin, brush-pulled quality of a marbled line; at 400 it is warm and plainly readable for facts.

### Hierarchy
- **Display** (300, clamp 3.4rem to 6rem, 0.95): the owner's name only, crossing from the margin into the basin. Phone: clamp(2.9rem, 13vw, 4rem).
- **Display Close** (300, clamp 3rem to 5.4rem, 1.05): the closing invitation above the contact details.
- **Headline** (300, clamp 2.3rem to 3.4rem, 1.05): section titles.
- **Title** (300, clamp 1.6rem to 2rem): project names; the lead project steps up to clamp(2rem, 2.8vw, 2.6rem).
- **Title Entry** (400, clamp 1.5rem to 1.9rem): role titles in the experience record, one weight heavier so they hold in diluted ink.
- **Lede** (400, clamp 1.15rem to 1.4rem, 1.45, max 30ch): the one opening sentence, in current; its key phrase goes to 500 in indigo.
- **Quote** (400 italic, clamp 1.2rem to 1.45rem, 1.4): reference quotes, the only sustained italic.
- **Body** (400, 17 to 19px fluid, 1.55, 58 to 62ch): prose and lists. Lining numerals throughout; dates use tabular numerals.
- **Label** (400, 0.85 to 0.9rem): fact labels, project meta, captions, in dilute.
- **Button** (500, 1rem, 1, +0.01em): buttons and emphasised links.

### Named Rules
**The Light Display Rule.** Headings are set at 300 (title-entry at 400) with negative tracking and balanced wrapping. Weight 500 marks emphasis in running text; 700 appears only as the browser's bold for quote attributions.

## Layout

A single centred content column (content-max) with a fluid gutter. Every section shares one left edge: the masthead and opening compute their inset from the same max-width and gutter, so the name, section heads and footer all hang from one line. Sections open with generous fluid top space (section) and a head block capped at 640px.

The opening is full-bleed and at least max(100svh, 720px) tall: the basin fills the sheet behind, and the still margin (max 560px) sits left holding headshot, name, lede, a facts row, actions and a quiet italic hint. The basin's ink fades out under the margin so text always sits on paper.

Projects use a two-column grid where the newest project leads at full width in a 7:5 split (print, then body) and the next two share a row. Experience is a hairline-ruled record in a 3:9 split (date, then content). References are three equal columns, each topped by an indigo rule. The close is a feathered print band followed by a large invitation and the email address.

**Responsive:** at 960px the lead project stacks and references become one column (max 640px). At 760px the masthead drops to 60px with a disclosure menu, the basin becomes a band across the top (60px + 40vh) with the name sitting on its lower rim, the headshot moves to the top right at 80px, all grids collapse to one column, and a fixed bottom dock carries Résumé and Email once the opening buttons scroll away.

**The One Edge Rule.** New sections align to the shared content inset; nothing floats on its own left edge.

## Elevation & Depth

The system is flat. There is no box-shadow anywhere. Depth comes from ink density: the basin carries all the visual weight, and on the still page darker ink means nearer and newer. The masthead is transparent over the basin and becomes solid paper with a mist hairline once the page scrolls. The phone dock is the one translucent surface (paper at 94% with a 10px backdrop blur), because it floats over content.

**The Flat Paper Rule.** Nothing casts a shadow. To lift or separate, use a hairline, a step of ink, or paper-deep.

**The Newest Is Darkest Rule.** Recency is shown by ink depth: the newest experience entry is indigo with a 14px drop, the next current with 10px, the oldest dilute with 7px; in the basin each site's newest drop is the darkest.

## Shapes

Gently rounded rectangles (sm, 6px) for every interactive or framed element: buttons, the copy button, the toast, project prints, the headshot. The one round form is the ink drop (drop), used as the date marker in the experience record. Borders are always 1px, mist for structure and indigo for emphasis (quote tops, the result line in a project, the outlined button). Edges of ink are never hard-cut: print bands and the no-WebGL fallback feather out through gradient masks.

## Components

### Buttons
Quiet and solid, like a stamp of ink.
- **Shape:** gently rounded (sm, 6px), 48px tall, 40px for the small variant in the masthead.
- **Ink (primary):** indigo fill, paper text, 1px indigo border. Used for Résumé. Hover moves to current.
- **Line (secondary):** 1px indigo outline on 85% paper, indigo text. Hover fills with indigo and turns text to paper. Used for Email.
- **Motion:** colour and border transitions at 0.25s on the house ease; press nudges down 1px.
- **Icons:** inline 24-unit SVG strokes (1.6 width, round caps) at 1.05em, inheriting currentColor.

### Links
Inline links inherit text colour with a 1px feather underline offset 0.22em; on hover the underline darkens to the text colour. Project links sit in a row with a small arrow icon, weight 500.

### Navigation
Masthead 72px, fixed: name at 500 on the left, section links in dilute on the right with a transparent 1px bottom border that becomes indigo on hover and for the current section, then the small ink Résumé button. Phone: a two-line toggle (rotates 90 degrees when open) reveals a stacked menu on paper with mist dividers, links at 1.15rem with 14px vertical padding.

### Facts Row
A wrapping row of label and value pairs under a mist hairline: labels in dilute at label size, values at 500.

### Experience Record
Hairline-ruled rows, each with a date column led by a round ink drop and a content column of title, place (dilute) and a short list. Ink depth steps down with age (see The Newest Is Darkest Rule).

### Reference Quote
Indigo top rule, italic quote in current, attribution in indigo bold with role in dilute.

### Copy Button and Toast
The copy button is a 40px outlined control in mist that firms to indigo on hover and fills with indigo when the copy succeeds. The toast is an indigo rectangle (sm radius) of paper text that rises 16px into place at the bottom centre and leaves after 3.2s.

### The Basin (signature)
A full-bleed WebGL2 canvas behind the opening. On load one composition plays out as drops bloom and the comb draws through them; afterwards pointer drags push currents through a small fluid simulation (it settles after 6s idle) and a click adds a drop: ink, then water, then a lighter ring. Colour is computed only from paper, dilute and indigo, with a faint grain. Without WebGL a CSS fallback draws two ink rings, masked to fade under the margin. Under reduced motion the finished sheet is drawn as one still frame and nothing moves. Prints (project placeholders and the band above contact) are separate sheets pulled from the same engine as they scroll into view, fading in over 1.2 to 1.4s; real screenshots replace them.

## Do's and Don'ts

### Do:
- **Do** pick every colour from the indigo family (indigo, current, dilute, feather, mist, paper-deep, paper) and keep the shader constants in step with the CSS properties.
- **Do** separate content with 1px mist hairlines and mark emphasis with a 1px indigo rule.
- **Do** set headings at weight 300 with negative tracking; emphasise running text at 500.
- **Do** show recency by ink depth: newest darkest, older entries diluted.
- **Do** keep text on the still paper margin; let the basin's ink fade out beneath it.
- **Do** keep the house ease (cubic-bezier(0.16, 1, 0.3, 1)) and render a single still frame under reduced motion.
- **Do** use gradients only as masks that feather ink edges into the paper.

### Don't:
- **Don't** use box-shadow, glow or tinted panels for depth.
- **Don't** fill buttons, bars or backgrounds with gradients; gradients exist only to feather ink.
- **Don't** introduce a second hue or a neon accent.
- **Don't** build card rows with icons; content sits on the sheet between hairlines.
- **Don't** add a second live animated surface; the basin is the one authored moment and prints are still once pulled.
- **Don't** use feather for text; it is too light to read.
