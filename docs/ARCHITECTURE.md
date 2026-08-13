# ZIRA System Architecture

## Overview

ZIRA is built as a high-performance full-stack web application designed for mobile devices across Rwanda and Africa.

### Stack Breakdown

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, HLS.js.
- **Backend**: Node.js, Express, TypeScript (`server.ts`).
- **Database**: PostgreSQL with Prisma ORM (`prisma/schema.prisma`), complemented by an in-memory/JSON store adapter for out-of-the-box local execution.
- **Media Storage**: Cloudflare R2 (`CLOUDFLARE_R2_*`) with structured key hierarchies and local mock storage adapter.
- **Video Transcoding**: `VideoProcessingService` abstraction generating multi-bitrate renditions (`360p`, `480p`, `720p`, `1080p`, `master.m3u8`).
- **Monetization Engine**: Direct sponsors, banner campaigns, impression & click counters, and affiliate partners.

---

## Directory Structure
```
zira/
├── prisma/
│   └── schema.prisma         # Production PostgreSQL Prisma Schema
├── src/
│   ├── components/           # Navbar, VideoPlayerModal, SponsorBanner, HeroBanner, etc.
│   ├── views/                # HomeView, BrowseView, MovieDetailsView, AdminView, etc.
│   ├── server/
│   │   ├── db/               # Data store & initial seed models
│   │   ├── routes/           # Auth, Movies, Series, Monetization, Admin API
│   │   └── services/         # Cloudflare R2 & Video Processing services
│   ├── test/                 # Automated unit tests
│   ├── types.ts              # Global TypeScript types
│   └── main.tsx              # React entry
├── docs/                     # Operations and setup manuals
├── .env.example              # Environment variables template
├── package.json
└── server.ts                 # Main Express server entry point
```
