# Sponsor Campaigns

Direct sponsor campaigns are free-to-watch placements, not subscriptions or pay-per-view. Configure sponsors and campaigns in the admin dashboard. Campaigns have a schedule, placement, destination, price/payment notes, optional limits, and creative records.

The public placement API chooses an active, in-window sponsor campaign and records an impression when it returns a creative. A click is recorded by the tracking endpoint when the banner is activated. CTR is clicks divided by impressions. Confirm destination URLs and image availability before activation.

The admin UI manages sponsor records, campaign status, and creatives. A complete R2-backed creative upload workflow is not currently available from the dashboard; the protected presigned-upload API can be used by an authorized upload client.

Do not enable popups, forced redirects, popunders, or ads that cover player controls.
