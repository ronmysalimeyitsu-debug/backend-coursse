# 12 — Matriz de pruebas

## Auth and tenant

| Case | Expected |
|---|---|
| Login valid | 200 + tokens |
| Login invalid | 401 |
| Switch to membership tenant | 200 |
| Switch to unrelated tenant | 404/403 documented |
| Suspended membership | denied |
| Tenant A reads machine B | 404 |
| Tenant A report excludes B | only A data |

## Roles

| Case | Expected |
|---|---|
| Analyst reads report | 200 |
| Analyst adjusts stock | 403 |
| Inventory manager adjusts | success + audit |
| Remove last tenant admin | 409 |
| Cross-tenant role assignment | rejected |

## Inventory

| Case | Expected |
|---|---|
| Restock within capacity | success |
| Restock over capacity | 409/400 documented |
| Negative adjustment invalid | rejected |
| Two orders last item | one succeeds |
| Expired reservation | stock released |
| Repeated release | no duplicate effect |

## Purchase

| Case | Expected |
|---|---|
| Active machine catalog | 200 |
| Maintenance machine order | 409 |
| Product from other tenant | rejected |
| Price manipulated by client | ignored/rejected |
| Duplicate order key | same order |
| Same key different body | 409 |

## Payment

| Case | Expected |
|---|---|
| Approve payable order | approved + job |
| Decline | declined, no job |
| Approve expired order | 409 |
| Duplicate approve | same result/no duplicate job |
| Wrong amount submitted | server amount used |

## Device

| Case | Expected |
|---|---|
| Valid device auth | token |
| Invalid key | 401 |
| Machine A requests B job | impossible/denied |
| Two polls same queued job | claimed once |
| Complete success | order completed + movement |
| Complete repeated | no duplicate movement |
| Failure | job/order state and audit correct |

## Operations

| Case | Expected |
|---|---|
| Process alive | health 200 |
| DB unavailable | health 200, ready 503 |
| Error | requestId returned |
| Logs | no secrets |
| Migration twice | controlled outcome |
| Seed twice | controlled outcome |

## End to end

```text
create tenant
→ create membership and roles
→ create location and machine
→ configure product and slot
→ restock
→ scan QR
→ create order
→ approve payment
→ simulator claims job
→ simulator completes
→ order completed
→ inventory reduced
→ reports updated
→ audit visible
```

