CREATE TABLE "AdPlacement" (
    "type" "AdPlacementType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AdPlacement_pkey" PRIMARY KEY ("type")
);

INSERT INTO "AdPlacement" ("type", "displayName") VALUES
    ('HOME_BETWEEN_RAILS', 'Home between rails'),
    ('HOME_BOTTOM_BANNER', 'Home bottom banner'),
    ('BROWSE_BANNER', 'Browse banner'),
    ('SEARCH_NATIVE', 'Search native'),
    ('MOVIE_DETAILS_BANNER', 'Movie details banner'),
    ('SERIES_DETAILS_BANNER', 'Series details banner'),
    ('PLAYER_COMPANION', 'Player companion'),
    ('FOOTER_BANNER', 'Footer banner');

DELETE FROM "PasswordResetToken";
ALTER TABLE "PasswordResetToken" RENAME COLUMN "token" TO "tokenHash";

CREATE TABLE "MovieCast" (
    "movieId" TEXT NOT NULL,
    "castMemberId" TEXT NOT NULL,
    "characterName" TEXT,
    "billingOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MovieCast_pkey" PRIMARY KEY ("movieId", "castMemberId")
);

CREATE TABLE "SeriesCast" (
    "seriesId" TEXT NOT NULL,
    "castMemberId" TEXT NOT NULL,
    "characterName" TEXT,
    "billingOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SeriesCast_pkey" PRIMARY KEY ("seriesId", "castMemberId")
);

ALTER TABLE "MovieCast" ADD CONSTRAINT "MovieCast_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovieCast" ADD CONSTRAINT "MovieCast_castMemberId_fkey" FOREIGN KEY ("castMemberId") REFERENCES "CastMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeriesCast" ADD CONSTRAINT "SeriesCast_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeriesCast" ADD CONSTRAINT "SeriesCast_castMemberId_fkey" FOREIGN KEY ("castMemberId") REFERENCES "CastMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SponsorCampaign" ADD CONSTRAINT "SponsorCampaign_placement_fkey" FOREIGN KEY ("placement") REFERENCES "AdPlacement"("type") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AffiliateCampaign" ADD CONSTRAINT "AffiliateCampaign_placement_fkey" FOREIGN KEY ("placement") REFERENCES "AdPlacement"("type") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MonetagPlacementSetting" ADD CONSTRAINT "MonetagPlacementSetting_placement_fkey" FOREIGN KEY ("placement") REFERENCES "AdPlacement"("type") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX IF EXISTS "WatchProgress_userId_movieId_episodeId_key";
DROP INDEX IF EXISTS "Watchlist_userId_movieId_seriesId_key";
DROP INDEX IF EXISTS "Rating_userId_movieId_seriesId_key";

ALTER TABLE "ContentRights" ADD CONSTRAINT "ContentRights_single_content_check" CHECK (num_nonnulls("movieId", "seriesId") = 1) NOT VALID;
ALTER TABLE "WatchProgress" ADD CONSTRAINT "WatchProgress_single_content_check" CHECK (num_nonnulls("movieId", "episodeId") = 1) NOT VALID;
ALTER TABLE "WatchHistory" ADD CONSTRAINT "WatchHistory_single_content_check" CHECK (num_nonnulls("movieId", "episodeId") = 1) NOT VALID;
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_single_content_check" CHECK (num_nonnulls("movieId", "seriesId") = 1) NOT VALID;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_single_content_check" CHECK (num_nonnulls("movieId", "seriesId") = 1) NOT VALID;
ALTER TABLE "VideoAsset" ADD CONSTRAINT "VideoAsset_single_content_check" CHECK (num_nonnulls("movieId", "episodeId") = 1) NOT VALID;

DELETE FROM "WatchProgress" older USING "WatchProgress" newer
WHERE older."userId" = newer."userId"
    AND older."movieId" IS NOT DISTINCT FROM newer."movieId"
    AND older."episodeId" IS NOT DISTINCT FROM newer."episodeId"
    AND (older."updatedAt", older."id") < (newer."updatedAt", newer."id");

DELETE FROM "Watchlist" older USING "Watchlist" newer
WHERE older."userId" = newer."userId"
    AND older."movieId" IS NOT DISTINCT FROM newer."movieId"
    AND older."seriesId" IS NOT DISTINCT FROM newer."seriesId"
    AND (older."createdAt", older."id") < (newer."createdAt", newer."id");

DELETE FROM "Rating" older USING "Rating" newer
WHERE older."userId" = newer."userId"
    AND older."movieId" IS NOT DISTINCT FROM newer."movieId"
    AND older."seriesId" IS NOT DISTINCT FROM newer."seriesId"
    AND (older."createdAt", older."id") < (newer."createdAt", newer."id");

CREATE INDEX "MovieCast_castMemberId_idx" ON "MovieCast"("castMemberId");
CREATE INDEX "SeriesCast_castMemberId_idx" ON "SeriesCast"("castMemberId");
CREATE INDEX "WatchProgress_userId_updatedAt_idx" ON "WatchProgress"("userId", "updatedAt");
CREATE INDEX "WatchProgress_movieId_idx" ON "WatchProgress"("movieId");
CREATE INDEX "WatchProgress_episodeId_idx" ON "WatchProgress"("episodeId");
CREATE UNIQUE INDEX "WatchProgress_userId_movieId_key" ON "WatchProgress"("userId", "movieId");
CREATE UNIQUE INDEX "WatchProgress_userId_episodeId_key" ON "WatchProgress"("userId", "episodeId");
CREATE INDEX "WatchHistory_userId_watchedAt_idx" ON "WatchHistory"("userId", "watchedAt");
CREATE INDEX "WatchHistory_movieId_idx" ON "WatchHistory"("movieId");
CREATE INDEX "WatchHistory_episodeId_idx" ON "WatchHistory"("episodeId");
CREATE INDEX "Watchlist_movieId_idx" ON "Watchlist"("movieId");
CREATE INDEX "Watchlist_seriesId_idx" ON "Watchlist"("seriesId");
CREATE UNIQUE INDEX "Watchlist_userId_movieId_key" ON "Watchlist"("userId", "movieId");
CREATE UNIQUE INDEX "Watchlist_userId_seriesId_key" ON "Watchlist"("userId", "seriesId");
CREATE INDEX "Rating_movieId_idx" ON "Rating"("movieId");
CREATE INDEX "Rating_seriesId_idx" ON "Rating"("seriesId");
CREATE UNIQUE INDEX "Rating_userId_movieId_key" ON "Rating"("userId", "movieId");
CREATE UNIQUE INDEX "Rating_userId_seriesId_key" ON "Rating"("userId", "seriesId");
CREATE INDEX "VideoAsset_movieId_idx" ON "VideoAsset"("movieId");
CREATE INDEX "VideoAsset_episodeId_idx" ON "VideoAsset"("episodeId");
CREATE INDEX "VideoAsset_status_idx" ON "VideoAsset"("status");
CREATE UNIQUE INDEX "VideoRendition_asset_rendition_key" ON "VideoRendition"("videoAssetId", "rendition");
CREATE INDEX "SubtitleTrack_videoAssetId_idx" ON "SubtitleTrack"("videoAssetId");
CREATE INDEX "SponsorCampaign_active_placement_dates_idx" ON "SponsorCampaign"("active", "placement", "startDate", "endDate");
CREATE INDEX "AdImpression_campaignId_createdAt_idx" ON "AdImpression"("campaignId", "createdAt");
CREATE INDEX "AdClick_campaignId_createdAt_idx" ON "AdClick"("campaignId", "createdAt");
CREATE INDEX "AffiliateClick_campaignId_createdAt_idx" ON "AffiliateClick"("campaignId", "createdAt");
CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");
CREATE INDEX "AnalyticsEvent_userId_createdAt_idx" ON "AnalyticsEvent"("userId", "createdAt");
CREATE INDEX "AdminAuditLog_adminId_createdAt_idx" ON "AdminAuditLog"("adminId", "createdAt");
CREATE INDEX "AdminAuditLog_entityType_entityId_idx" ON "AdminAuditLog"("entityType", "entityId");