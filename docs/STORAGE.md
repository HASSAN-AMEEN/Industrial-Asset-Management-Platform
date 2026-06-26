# File Storage Strategy

## Current state (dev)

Training PDFs are written to the local filesystem under
`backend/uploads/training-pdfs/<uuid>.pdf` and served by an Express static
middleware at `/uploads/...`. The DB stores the **relative path**
(`/uploads/training-pdfs/<uuid>.pdf`); the absolute URL is rebuilt at read time
using `config.BASE_URL`. Old absolute URLs are auto-healed by the same code
path, so records survive host/IP changes.

This works fine for a single-machine dev setup or a VPS with a persistent disk.
It will **break** on most modern PaaS platforms because their filesystems are
ephemeral.

## Production risk

| Hosting type | Files survive restart? | Files survive deploy? |
|---|---|---|
| VPS / dedicated server (DigitalOcean Droplet, EC2 with EBS, bare-metal) | ✅ | ✅ |
| Docker / K8s with a mounted volume | ✅ | ✅ |
| Heroku, Render, Railway, Cloud Run, Fly.io (no volume attached) | ❌ wiped on restart | ❌ wiped on deploy |
| AWS Lambda / Vercel Functions | ❌ read-only or per-invocation | ❌ |
| Multiple instances behind a load balancer | ⚠️ files are local to one instance — other instances 404 | n/a |

If the production host falls in the bottom three rows, the local-disk approach
is wrong before we even talk about durability or backups.

## Proposed abstraction

A small `FileStorage` interface with two drivers — `local` (current behaviour)
and `cloud` (S3-compatible). The driver is selected by env var. No call sites
change beyond the upload + delete points.

### Interface

```ts
// backend/src/services/storage/types.ts
export interface StoredFile {
  /** Stable identifier used to persist + later resolve / delete. */
  key: string;          // e.g. "training-pdfs/<uuid>.pdf"
}

export interface FileStorage {
  /** Persist a buffer or stream. Returns the key to store in the DB. */
  put(input: {
    body: Buffer | NodeJS.ReadableStream;
    contentType: string;
    folder: string;     // logical bucket within the store (e.g. "training-pdfs")
    filename: string;   // already-uuid-named, with extension
  }): Promise<StoredFile>;

  /** Build the URL the client should fetch. May be a CDN URL, a presigned URL,
   *  or a local /uploads path. */
  url(key: string): string;

  /** Best-effort delete; returning false on missing-file is not an error. */
  remove(key: string): Promise<void>;
}
```

### Drivers

**`local`** — multer disk storage + Express static. Identical to today.
`url(key)` returns `${BASE_URL}/uploads/${key}`. `put` accepts a Multer file
that's already on disk; `remove` unlinks.

**`s3`** — uses `@aws-sdk/client-s3` (works against any S3-compatible API:
AWS S3, Cloudflare R2, DigitalOcean Spaces, Backblaze B2, MinIO).
`put` uploads with `ACL: 'public-read'` or signs URLs on demand. `url(key)`
returns either the public CDN URL or a presigned GET URL.

### Selection

```env
# .env
STORAGE_DRIVER=local           # local | s3
S3_BUCKET=tayyab-uploads
S3_REGION=auto
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com   # for R2/Spaces
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_URL_BASE=https://cdn.tayyabtraders.com         # if behind a CDN
```

`backend/src/services/storage/index.ts` reads `STORAGE_DRIVER` once at boot
and exports the right driver.

### Migration path

1. Land the abstraction with `local` driver — no behaviour change.
2. Replace `multer.diskStorage` in `training.routes.ts` with
   `multer.memoryStorage` so we receive a buffer, then forward to
   `storage.put`. The local driver writes that buffer to the same path it
   uses today.
3. Add the `s3` driver behind the same interface.
4. In production, flip `STORAGE_DRIVER=s3`. Local dev keeps `STORAGE_DRIVER=local`.

### What goes in the DB

Continue storing **the key** (e.g. `training-pdfs/<uuid>.pdf`), not a URL.
The driver builds the URL. This is the same invariant the codebase already
moved to with Fix 1 — the cloud abstraction just generalises it.

## Recommended provider for first prod cut

**Cloudflare R2** — S3-compatible, no egress fees, a public bucket can be
fronted by Cloudflare's free CDN. Cheaper than S3 for read-heavy workloads
like serving training PDFs.

## What this doc does *not* cover (yet)

- Virus scanning on upload (would sit between multer and `storage.put`).
- Image variants / thumbnails (no images yet — installation photos in SRD §7
  will need this).
- Signed-URL expiry policy for private files (current PDFs are public).
- Retention / soft-delete (today we hard-unlink on training-material delete).
