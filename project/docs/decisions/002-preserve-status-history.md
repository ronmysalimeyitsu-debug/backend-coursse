# ADR 002: Preserve Status History

## Status
Accepted

## Context
We need an audit trail of status transitions for requests to track lifecycle changes over time (open -> in_progress -> closed) without losing historical records.

## Decision
Create a dedicated `request_status_history` table linked via foreign key to `requests`. Every status modification will log a history entry inside a database transaction alongside the update operation.

## Consequences
- Full traceability of request changes.
- Ensures data integrity via transactional safety.