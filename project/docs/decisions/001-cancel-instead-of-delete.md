# Cancel requests instead of deleting them

## Context

The class-03 requirements include "cancel a request" and "preserve the history of the
request". A naive reading maps "cancel" to `DELETE /requests/:id`, physically removing the
item from the array. We had to decide what cancelling actually means for this system.

## Options

### Option 1: Physically delete the request

Benefits:

* Simplest possible implementation (`array.splice`).
* The collection only contains "live" items; no filtering needed.
* Matches the CRUD acronym expectation.

Costs:

* The history of the request disappears: nobody can answer "what happened with #42?".
* Future features (comments, audit trail) would hold references to a request that no longer
  exists.
* Nothing can be recovered after an accidental deletion.
* Deleting also breaks the id sequence assumptions of any client that cached the list.

### Option 2: Preserve it with status `cancelled`

Benefits:

* The request and its history survive; audit and recovery remain possible.
* Comments and future references stay valid.
* Cancelling becomes part of the lifecycle: the state machine controls when it is allowed
  (from `open` or `in_progress`, never from `resolved` or `closed`).

Costs:

* Cancelled requests keep occupying memory and appear in unfiltered listings; consumers must
  filter by status when they only want active items.
* New rules appear: what can be done with a cancelled request? (Answer: nothing — it is
  terminal.)
* The API has no true `DELETE`, which may surprise consumers that expect full CRUD.

## Decision

Option 2. We do not implement `DELETE /requests/:id`. Cancelling is a controlled transition:
`PATCH /requests/:id` with `{ "status": "cancelled" }`, allowed from `open` and
`in_progress`. `cancelled` is a terminal status.

This is a decision for THIS domain, not a universal rule: in domains with legal deletion
requirements (personal data), physical deletion would be mandatory.

## Consequences

What do we gain?

* Complete history of every request, including the interrupted ones.
* A single modification pathway (`PATCH`) protected by the state machine.

What complexity appears?

* Listings that only want active requests must filter (`?status=open` etc.).
* The terminal-status rule (`409 REQUEST_IN_TERMINAL_STATUS`) exists mostly because
  cancelled items stay around.

What can no longer be done?

* Physically removing a request through the API.

What may need to change later?

* If the collection grows, we may need an "archived" view or default filters.
* If legal deletion requirements appear, we will need a real deletion path with its own
  rules, documented as a new decision that supersedes this one.
