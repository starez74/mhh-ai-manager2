# Database

## Verified

The repository contains existing schema and migration files through `v5.1-migration.sql`. Current application domains include campaigns, customers, enquiries, quotes, jobs and activity events.

## Implemented

No database schema or migration changes are included in this architectural foundation. Existing tables and behaviour are preserved.

Stable service queries now use explicit column selections for customers, enquiries, quotes, jobs and activity events.

## Proposed

Any v6 database change must be introduced in a new ordered migration after review. Existing migration files remain unchanged.
