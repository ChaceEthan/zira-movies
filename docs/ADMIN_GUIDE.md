# Admin Guide

Admin routes require a valid access token and `ADMIN` or `SUPER_ADMIN` role. Editors can create/update content where the API explicitly grants editor access; hiding a UI tab is not the authorization boundary.

## First Administrator

Register the intended account through the public registration flow, verify ownership out of band, set `ADMIN_EMAIL` in the backend environment, then run:

```bash
npm run admin:promote -- admin@example.com --i-verified-ownership
```

The email passed on the command line must match `ADMIN_EMAIL`. Do not seed or expose a built-in admin credential.

## Available Dashboard Areas

The current dashboard provides overview metrics, movie and series views, content-rights review, sponsor and campaign management, Monetag placement configuration, affiliate partner/campaign management, monetization analytics, and audit logs. Direct sponsor and affiliate campaigns track impressions/clicks; CTR is clicks divided by impressions.

Dedicated user management, series season/episode editing, a complete upload library/workflow, and promoted-content management are not yet implemented. Do not treat the current UI as providing those controls. Upload presigning is an API capability for authorized editors/admins, not a completed admin upload workflow.

## Publishing and Rights

Allowed rights states are `OWNED`, `LICENSED`, `PERMISSION_GRANTED`, and `PUBLIC_DOMAIN`, subject to current rights dates. `PENDING_VERIFICATION` and `EXPIRED` must never be published. Keep license evidence in restricted operational records; do not put sensitive contracts into public metadata.

## Monetization

ZIRA V1 remains free to watch. Use direct sponsor banners, affiliate placements, promoted content, and house campaigns only. Do not configure forced redirects, popups, or player-control overlays. Verify sponsor destinations and publisher script origins before enabling campaigns.
