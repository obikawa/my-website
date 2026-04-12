# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (localhost:4321)
npm run build     # Build to dist/
npm run preview   # Preview the production build
```

## Architecture

This is a static Japanese-language website for **おびかわ社労士事務所** (Obikawa Social Insurance Labor Consultant Office), built with **Astro 5** and **Tailwind CSS**. It is deployed on **Netlify**.

### Page structure

- `src/layouts/Layout.astro` — single shared layout; handles `<head>`, sticky nav, and footer. Takes `title` and optional `description` props.
- `src/pages/index.astro` — homepage with hero, services, profile, and CTA sections
- `src/pages/price.astro` — pricing tables (retainer contracts, procedures, work rules)
- `src/pages/contact.astro` — Netlify Form contact form, posts to `/contact/success`
- `src/pages/contact/success.astro` — form submission success page

### Styling conventions

Tailwind is configured with two custom color palettes in `tailwind.config.mjs`:

- `primary` — indigo scale (`primary-50` through `primary-900`), used for brand color throughout
- `accent` — sky scale (`accent-500`, `accent-600`), available but sparingly used

Font: `Noto Sans JP` loaded from Google Fonts, set as the default `font-sans`.

### Netlify integration

- The contact form uses Netlify Forms (`data-netlify="true"`, `netlify-honeypot="bot-field"`). The hidden `<input name="form-name" value="contact" />` field is required for Netlify to detect the form at build time.
- `public/_redirects` contains a single SPA redirect rule (`/* /index.html 200`).

### Google Analytics

GA4 tag (`G-6HLXWWR9P4`) is inlined directly in `Layout.astro`'s `<head>`.
