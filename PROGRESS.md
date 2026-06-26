# Progress Tracker

Last updated: 2026-07-07

Use this file as the single source of truth for feature status. Update it after every feature implementation, bug fix, or behavioral change.

Status legend:
- ✅ Complete: implemented and working
- ⚠️ Partial: present but incomplete or missing pieces
- ❌ Missing: not implemented

## Update Rule

When you finish a feature or fix:
- update the status
- add a short note describing what changed
- add the date in the notes if helpful
- keep notes brief and factual

## Current Baseline

### Auth
- Email + password login: ✅ Complete
- JWT authentication: ✅ Complete
- Role-based access control: ✅ Complete

### Machines
- Add machine: ✅ Complete - standalone mobile flow now creates machines through the backend
- Edit machine: ✅ Complete
- Delete machine: ✅ Complete - mobile delete action now confirms before removing a machine
- View machine list: ✅ Complete
- Search by serial number: ✅ Complete
- Filter by status, warehouse, model, date: ✅ Complete
- View full status history per machine: ✅ Complete
- Status lifecycle: ✅ Complete
- Status changes logged with timestamp and user: ✅ Complete

### Warehouses
- Add warehouse: ✅ Complete
- Edit warehouse: ✅ Complete
- Delete warehouse: ✅ Complete
- View machines stored in a warehouse: ✅ Complete - mobile warehouse details now shows the warehouse machine list
- View warehouse inventory count: ✅ Complete - mobile warehouse cards/details now display inventory totals
- Filter machines by type within warehouse: ✅ Complete - mobile warehouse machine view now exposes a type filter

### Shipments
- Create shipment (single or multiple machines): ✅ Complete
- Edit shipment: ✅ Complete
- Cancel shipment: ✅ Complete
- View shipment list: ✅ Complete
- Filter shipments by date and status: ✅ Complete - mobile shipment list now exposes date-range filtering alongside status
- Dispatch shipment: ✅ Complete
- Mark shipment as delivered: ✅ Complete
- Auto-update machine status on shipment status change: ✅ Complete
- Shipment activity log with user and timestamp: ✅ Complete

### Installations
- Create installation when machine marked as INSTALLED: ✅ Complete
- Capture installation location from a Google Maps link: ✅ Complete - on INSTALLED, the user pastes a Google Maps link (Share → Copy link). Backend parses exact coordinates from any Maps URL form (`@lat,lng`, `q/ll/query=`, `!3d!4d`) and resolves short links (`maps.app.goo.gl`) via redirect. Falls back to lat/lng, then to address geocoding. See `backend/src/utils/geo.ts` (`parseGoogleMapsUrl`).
- Store installation address with geocoded lat/lng: ✅ Complete - link-derived coordinates are precise; Nominatim geocoding remains only as a fallback when no link is given.
- View installation list: ✅ Complete
- Installation map with pins: ✅ Complete - OpenStreetMap tiles (chosen free, no-key basemap). Custom status-coloured pins, auto fit-to-all on load, recenter button, per-pin "Open in Maps", and an "Open in Maps / Directions" action on the selected card.
- Tap pin to view machine serial, model, client name, installation date: ✅ Complete
- Filter map by machine type, city, installation date: ✅ Complete - status, machine-type, city, date-range presets (7/30/90 days) + manual range, and free-text search; machine-type and city filter client-side from loaded data.

### Training Hub
- View training materials list: ✅ Complete - mobile library screen renders materials with type badges and metadata
- Search training materials: ✅ Complete - search bar filters on title and machine model
- Filter by category/machine model: ✅ Complete - type (VIDEO/PDF) and machine model filters available in the library
- View video inside app: ✅ Complete - YouTube playback via react-native-youtube-iframe in detail screen
- View/download PDF manual: ⚠️ Partial - works on iOS via WebView (PDF rendered natively from local server); Android WebView does not render PDFs inline yet (needs PDF.js viewer or react-native-pdf). Download button uses Linking to open in browser.
- Upload training video (Admin): ✅ Complete - admin form accepts YouTube URL and optional thumbnail
- Upload PDF manual (Admin): ✅ Complete - PDFs now stored locally on the backend under `backend/uploads/training-pdfs/` and served via `/uploads/...`. Cloudinary removed. Requires `BASE_URL` env var so generated URLs are reachable from the LAN.

### Dashboard
- Total machines count: ✅ Complete
- Machines breakdown by status: ✅ Complete
- Machines per warehouse: ⚠️ Partial - not returned by dashboard payload
- Total installations count: ⚠️ Partial - no aggregate count is exposed yet
- Shipments currently in transit: ✅ Complete
- Recent activity log: ✅ Complete

## Backend API Verification

- 2026-07-07: Full backend smoke test added at `backend/scripts/smoke-test.mjs`. Run with `node scripts/smoke-test.mjs` (server must be running). Walks a machine through its full lifecycle (create → reserve → ship → dispatch → deliver → install) and exercises every module's read/write endpoints, then tears down its test data via Prisma.
- 2026-07-07: All 37 smoke-test steps pass across auth, dashboard, notifications, training, warehouses, clients, machines, shipments, installations.
- 2026-07-07: Fixed a systemic regression from a `prisma db pull` introspection that stripped `@default(uuid())` and `@updatedAt` off the schema — this had broken nearly every create (warehouse/client/shipment/installation and all history inserts). Restored both attributes in `schema.prisma` and regenerated the client (no migration needed).
- 2026-07-07: Fixed the machine status-change DB error — `machine.service.ts` used the stale `warehouse: true` include instead of the current `warehouses` relation name (3 sites).
- 2026-07-07: Warehouse delete now returns a graceful message when shipments reference it (previously leaked a raw Prisma foreign-key error).

## SRD UAT Follow-ups (2026-07-07)

- RBAC aligned to SRD §2 and verified by `backend/scripts/rbac-test.mjs` ("matches the SRD matrix exactly"): Technician can update installations; Sales/Ops is view-only on shipments/clients/installations; Super Admin manages users.
- Dashboard: now returns machines-per-warehouse, installations count, full status breakdown, shipments-in-transit (optimized `groupBy`); mobile dashboard uses skeletons + count-up + animated bars and working quick-action buttons (no hardcoded data).
- User Management: new Super-Admin-only `/api/users` CRUD module + real mobile UserManagementScreen; Settings tab gating fixed (admin → users + warehouses; others → profile).
- Machine Details: `MachineDetailScreen` rebuilt as a real screen (machine info + live status-history timeline), reachable by tapping a machine. Removed the old mock.
- Fixed latent machine response shaping: `machine.service.ts` now maps Prisma relations to `warehouse`/`client`/`installation` (was returning raw `warehouses`/`clients`/… so the list location tag never resolved).

### Resolved (2026-07-07, batch 2)
- Neon interactive-transaction reliability: `DATABASE_URL` switched to the **direct (non-pooler)** endpoint (pooled URL kept commented). Validated with `backend/scripts/test-direct-db.mjs`. **Requires a backend restart to take effect.**
- N+1 removed: `MachineListScreen` no longer pre-fetches `/machines/:id/history` per machine; `MachineCard` history section dropped (full history now on the detail screen).
- Pagination: machine + shipment list endpoints accept `page`/`limit` (machine list also `category`, `purchaseFrom`/`purchaseTo`; shipment list also `search`) and return `{ data, pagination }` (opt-in; no limit = all, back-compat). Both lists are now fully server-driven (filters/search → server) with infinite scroll. Shipment `search` matches tracking id / warehouse / client / machine serial server-side; the active tab shows the server-side total.
- Hardened machine interactive transactions (INSTALLED, delete) with a 30s timeout (`INTERACTIVE_TX_OPTIONS`) — Prisma's 5s default was being exceeded on slower connections.

### Resolved (2026-07-07, batch 3)
- Manager contact moved to the user: added nullable `users.contact` (db push); wired through user create/update + the warehouse-managers list. Contact now belongs to the manager, not the warehouse.
- Navigation restructured: **Settings tab replaced by a Warehouses tab**. Added a global right-side **slide-in drawer** (custom, no new deps — `DrawerContext` + `components/AppDrawer.tsx`, opened by a hamburger in every tab header) holding Profile info, **User Management** (Super Admin), and **Log Out**. Removed the old `SettingsScreen`.
- Fixed `Header` to actually render the back button (`showBack` was previously a no-op) and added a `showMenu` hamburger.
- Warehouse screen rebuilt clean (list + search + Create FAB; create/edit modal with **optional** manager assignment from existing managers; shows the manager's contact; expandable inventory; read-only for non-admins). Warehouses can be created without a manager and assigned later via edit. Manager *user* creation happens in User Management (drawer).
- Direct Neon endpoint confirmed reliable for interactive transactions after restart (smoke 37/37). Note: Neon serverless auto-suspends — the **first request after idle can fail once with "Can't reach database server" then succeed** (cold start). Consider a small connection retry if this is disruptive in production.

### Resolved (2026-07-07, batch 4)
- Mobile write-button gating: create/edit/delete + status actions are now hidden for view-only roles. Machines & Shipments gate their FAB + card actions to Super Admin / Warehouse Manager (`canManage`); ShipmentCard got a `canManage` prop to hide its action row. Warehouses (SA-only), Training upload (SA-only), and User Management (SA-only) were already gated. RBAC is now enforced in both the API and the UI.

### Resolved (finishing-moves)
- **Bottom nav filtered per role.** `mobile/src/navigation/AppNavigator.tsx` now derives the visible `Tab.Screen`s from the user's role via an `ALL_TABS` matrix. SA/WM see all 6; SO sees Dashboard, Machines, Shipments, Map, Training (no Warehouses); Tech sees Dashboard, Map, Training only. Custom tab bar filters its icons from the same matrix. Dashboard quick-actions and the "See All → Machines" shortcut are gated for roles that don't have the Machines/Shipments tabs, so no dead navigation targets are reachable.
- **Error UI standardised.** Added `mobile/src/utils/errors.ts` (`parseApiError` + `ParsedApiError`) plus two new components: `ErrorState` (full + inline variants, retry button) and `ErrorBanner` (animated slide-down, dismissible). `parseApiError` maps axios/fetch failures into structured `{ kind, title, description, icon }` so each error renders with the right tone (network/auth/forbidden/validation/conflict/server/unknown). Login, Signup, Dashboard, MachineList, and WarehouseManagement screens were migrated off raw `<Text style={errorText}>...` to these components. Same pattern can be applied to the remaining list screens identically.
- **Logging cleaned up.** Prisma no longer logs every query to stdout — `backend/src/config/database.ts` now defaults to `['error']` and opts into `['query','error','warn']` only when `PRISMA_DEBUG=1` is set. The mobile `apiClient` no longer console-logs every request/response. `errorHandler` now uses the project logger and only stack-dumps real 5xx errors (4xx is logged as a single warn line). `training.service` console.error swapped to `logger.error`.

### Known follow-ups (not blocking)
- ShipmentListScreen and a few other screens still use `Alert.alert('Error', ...)` for action failures. They work, but for consistency they should migrate to `ErrorBanner` (transient) or `ErrorState` (load failures) — the components are now in place.
- Technician installation assignment + image upload (SRD §7) are not yet implemented; backend still returns *all* installations for technicians, and no image endpoints exist.

### Resolved (PDF storage host-independence)
- **Training PDF URLs now host-independent.** Previously `pdfUrl` stored the full URL with whatever `BASE_URL` was at upload time, so every old record broke when the server's host/LAN IP changed (a recurring dev-pain when hopping WiFi networks). New uploads now persist only the relative path (`/uploads/training-pdfs/<uuid>.pdf`); the absolute URL is rebuilt at read time from the current `BASE_URL`. Old records with absolute URLs are auto-healed on read by rewriting the host portion. `backend/src/modules/training/training.service.ts` (`resolveUrl` + `withResolvedUrls`).
- **Production storage strategy documented** in [`docs/STORAGE.md`](docs/STORAGE.md). Current local-disk approach is safe on a VPS with persistent disk but will break on any PaaS with ephemeral filesystems (Heroku/Render/Cloud Run/Fly.io without an attached volume) and in multi-instance deployments. Design proposes a `FileStorage` interface with `local` + `s3` (Cloudflare R2 recommended) drivers, selected by env var. Not implemented yet — pending hosting decision.

### Known issues to address next
- Machine list category-filter options are derived from loaded pages (may be partial under pagination); shipment tabs/search filter the loaded set. Consider a distinct-categories endpoint / server-side shipment status counts if needed.
- Installation images (SRD §7.2 + Technician) and S3/HTTPS remain.

## Notes

- Keep this file updated whenever a feature changes status.
- Prefer one-line notes so the tracker stays easy to scan.
- If a feature regresses, change the status immediately rather than adding a separate issue list.
