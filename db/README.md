# Database

`schema.mysql.sql` creates the app's MySQL schema: `users`, `requests`,
`drivers`, `history`, `attachments`, `notifications`, plus a least-privilege
`tms_app` user scoped to the `tms_driver_portal` database only. It's
idempotent - safe to re-run against a database that already has some or all
of these tables (it upgrades older copies in place via `information_schema`
checks rather than dropping anything).

Setup:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS tms_driver_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root tms_driver_portal < db/schema.mysql.sql
```

Then set `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` in
`backend/.env` (use the `tms_app` user the script creates, not root), and run
`npm run seed` from `backend/` to load the demo dataset (`backend/src/data/
seed.js`) - 8 accounts (see that file for the account/role list; the shared
demo password is in `DEMO_PASSWORD`) plus a handful of sample requests.

The backend connects via `backend/src/data/db.js` (a `mysql2` connection
pool); every repository in `backend/src/data/repositories/*.js` reads and
writes through it.

An earlier version of this schema targeted SQL Server (T-SQL, run manually
in SSMS) but was never wired up to the backend and has been removed in favor
of MySQL, which is what's actually deployed here.

## Resolved dependency risk (previously documented here, now fixed)

This section used to flag `xlsx@0.18.5` (SheetJS) as an unfixable
`npm audit` finding (prototype pollution, ReDoS, "No fix available" since
SheetJS stopped publishing patches to the npm registry). That dependency has
since been removed entirely — `backend/src/services/excelService.js` now
does all Excel read/write work through `exceljs` alone, which was already a
dependency for the upload template builder.

The `exceljs`-transitive `uuid` advisory (moderate, buffer bounds check) is
resolved via a `"overrides": { "uuid": "^11.1.1" }` entry in
`backend/package.json`, which pins the nested `uuid` dependency to a patched
version without downgrading `exceljs` itself.

`backend` and `frontend` both report 0 `npm audit` vulnerabilities as of this
change, aside from one documented, non-exploitable finding in the frontend
(see `frontend/README.md`).
