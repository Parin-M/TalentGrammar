# TalentGrammar

A Chrome Manifest V3 starter for a bilingual Persian/English writing assistant.

## Current status

This repository contains the extension shell, popup, settings/About page, context-menu entry, and a GitHub Actions build workflow. **The TinyFix and Nevise inference engines are not integrated in this starter build yet.** The UI must not claim to provide live proofreading until those engines are connected and tested.

- TinyFix is a small English ONNX model distributed with its JavaScript package.
- Public Nevise v1 is a Persian BERT spell-checker with a large checkpoint; it is not currently suitable for direct bundling into a small extension without conversion/optimization.
- No text is sent to a server by this starter.

## Build

```sh
npm ci
npm run build
```

The unpacked extension is in `dist/`. Load it at `chrome://extensions` with Developer mode enabled.

## Build artifact

Pushes to `main` run GitHub Actions and publish a ZIP artifact named `TalentGrammar-chrome-extension`.

## About

این نرم‌افزار توسط پَـــرین مشعلـــچیان توسعه داده شده

Telegram: https://t.me/Talent_Academia
