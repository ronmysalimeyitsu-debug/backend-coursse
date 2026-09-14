# Preserve request status history

## Context

Since class 03 the backlog carried the requirement "preserve the history of the request".
With persistence in place (class 04), we had to decide whether the system remembers only the
current status of each request or every transition it went through.

## Options

### Option 1: Keep only the current status

Benefits:

* Less data: one column, no extra table.
* Less code: no second write, no transaction needed for status changes.
* Every query stays trivially simple.

Costs:

* "When did this move to in_progress?" and "who reopened it?" become unanswerable.
* Auditing and diagnosing a dispute ("it was already resolved last week") is impossible.
* The information is destroyed at the moment of each change — it cannot be reconstructed later.

### Option 2: Store every status transition

Benefits:

* Complete, queryable history per request, including its birth (`NULL → open`).
* Auditing, diagnosis and future metrics (time in each status) become possible.
* The foreign key ties every event to its request with database-level integrity.

Costs:

* A second table, a second write on every status change, and the code to keep them aligned.
* A consistency problem appears: a status change without its history row (or vice versa)
  makes the database lie. This forces the change to run inside a transaction.
* Storage grows with every transition (acceptable at this scale; revisit if it ever isn't).

## Decision

Option 2. `request_status_history` stores one row per transition. Creation records
`NULL → open`; every later status change records `previous → new`. The status update and the
history insert run inside a single transaction (same client, `BEGIN`/`COMMIT`/`ROLLBACK`) so
both happen or neither does.

## Consequences

What do we gain?

* `GET /requests/:id/history` and honest answers about the past.
* Auditability that survives restarts and reaches every instance.

What additional data and code appear?

* The 002 migration, `insertStatusHistory` in the store, and the transactional unit in the
  service.

What consistency problem must be handled?

* Two writes forming one logical unit — handled with `withTransaction`; a failure in either
  write rolls back both.

What queries become possible?

* Full timeline per request; later: time-per-status metrics, reopened-request counts.

What may need to change later?

* If history grows large, an index on `request_status_history(request_id)` justified by the
  history query, or an archival policy — each as its own documented decision.
