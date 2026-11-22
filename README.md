# TalentGrammar

TalentGrammar is a Chrome Manifest V3 writing assistant with bundled, local-first English and Persian spelling checks.

## Included in this build

- **English:** TinyFix 0.1.1 runs with ONNX Runtime Web. Its ONNX model, word lists, and confusion list are bundled in the extension.
- **Persian:** a lightweight browser-side adaptation of Shekar's statistical spelling approach, using Shekar v1.8.0 vocabulary data and one-edit candidate ranking. This is not the complete Python Shekar package.
- Live suggestions in editable fields, with explicit Accept and Dismiss actions.
- Settings for enable/disable and language toggles; About section and project Telegram link.

The model and vocabulary assets are downloaded during the CI build and included in the ZIP. Runtime proofreading uses extension-local assets; text is not sent to a remote service. Suggestions are limited: TinyFix is English-only, and the Persian adaptation is spelling/vocabulary based rather than full contextual grammar correction.

## Build

```sh
npm install
npm run build
npm test
```

The unpacked extension is in `dist/`. Load it at `chrome://extensions` with Developer mode enabled.

GitHub Actions builds and validates the extension, then uploads a ZIP artifact named `TalentGrammar-chrome-extension`.

## About

این نرم‌افزار توسط پَـــرین مشعلـــچیان توسعه داده شده

Telegram: https://t.me/Talent_Academia

## Third-party licenses

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
