# Deploy-Time I18N

This repository now supports **deploy-time locale locking** (no runtime language switch).

## Environment Variables

- `APP_LOCALE`: `fa` or `en`
- `APP_DIRECTION`: `rtl` or `ltr` (optional)
- `NEXT_PUBLIC_APP_LOCALE`: `fa` or `en` (frontend + landing)
- `NEXT_PUBLIC_APP_DIRECTION`: `rtl` or `ltr` (frontend + landing, optional)

Default behavior:

- Locale defaults to `fa`
- Direction defaults to `rtl`
- English deployment is configured as `rtl` by default

## What Was Wired

- Backend:
  - Fixed deployment locale middleware (`DeploymentLocaleMiddleware`)
  - Locale-aware serializers for page/article payloads
  - Locale-aware cache keys in article endpoints
  - Locale-aware payment templates
- Frontend:
  - Shared deploy-locale config and localization helpers
  - HTML `lang/dir`, API headers, metadata locale, cache keys tied to deploy locale
  - Localized widget fallbacks and key global UI states
- Landing:
  - Shared deploy-locale config
  - HTML `lang/dir`, metadata locale, API language headers
  - Key navigation/panel labels localized

## Coverage Audit

Run this to find remaining hardcoded Persian strings:

```bash
python tools/i18n_audit.py frontend backend landing
```

Non-zero exit code means untranslated hardcoded text still exists.

