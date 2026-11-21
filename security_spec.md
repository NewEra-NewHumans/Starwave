# StarRipple (星涟) Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Verified Email Gate**: Every write to `/users/{userId}`, `/account_ids/{accountId}`, and `/users/{userId}/friends/{friendId}` requires `request.auth != null` and `request.auth.token.email_verified == true`.
2. **PII Isolation & Zero-Scraping**:
   - `/users/{userId}` stores the user's Google/Microsoft email (`email`) and may ONLY be `get`-read by `request.auth.uid == userId`. `allow list` on `/users` is permanently `false`.
   - `/account_ids/{accountId}` contains zero PII (no `email` field) and forbids `allow list` so attackers cannot enumerate all registered users; authenticated users may only `get` a specific 9-digit ID (`^[1-9][0-9]{8}$`).
3. **Atomic ID Allocation (`existsAfter` / `getAfter`)**:
   - A `/users/{userId}` document and its corresponding `/account_ids/{accountId}` index document MUST be created atomically in the same transaction/batch. Neither document can exist without the other pointing back to the same `uid` and `accountId`.
4. **Immutable Core Identity**:
   - `uid`, `email`, `emailProvider`, `accountId`, `createdAt` on `/users/{userId}`, and `accountId`, `uid`, `emailProvider`, `createdAt` on `/account_ids/{accountId}`, and `friendId`, `uid`, `accountId`, `createdAt` on `/users/{userId}/friends/{friendId}` are immutable after creation.
5. **Master Gate & Query Enforcer**:
   - Single-doc reads/writes on `/users/{userId}/friends/{friendId}` verify `exists(/databases/$(database)/documents/users/$(userId))`.
   - `allow list` on `/users/{userId}/friends` enforces `isSignedIn() && resource.data.uid == request.auth.uid` without any `get()`/`exists()` inside `allow list`.
6. **Temporal Integrity & Strict Keys**:
   - Every create requires `createdAt == request.time && updatedAt == request.time`.
   - Every update requires `updatedAt == request.time`, `isValid[Entity]` schema validation, and `affectedKeys().hasOnly(...)`.

## 2. The "Dirty Dozen" Hostile Payloads
1. **Unverified Email Spoof Create** (`users/{uid}`): Authenticated user with `email_verified: false` tries to create `/users/{uid}`. Must return `PERMISSION_DENIED`.
2. **Orphaned User Profile Without Atomic Index** (`users/{uid}`): Verified user writes `/users/{uid}` outside a transaction without creating `/account_ids/{accountId}` in the same commit. Must return `PERMISSION_DENIED`.
3. **PII Cross-User Read** (`users/{victimUid}`): Signed-in user `attackerUid` attempts `get` on `/users/{victimUid}`. Must return `PERMISSION_DENIED`.
4. **User Directory Scraping** (`users` or `account_ids`): Signed-in user runs `list` query against `/users` or `/account_ids`. Must return `PERMISSION_DENIED`.
5. **Shadow Ghost Field Injection** (`users/{uid}`): Verified user adds `"isAdmin": true` or `"role": "owner"` in create/update payload. Must return `PERMISSION_DENIED`.
6. **Exclusive Account ID Hijacking / Mutation** (`users/{uid}`): Verified user attempts to update their `accountId` or `email` after registration. Must return `PERMISSION_DENIED`.
7. **Account Index Spoofing** (`account_ids/{accountId}`): Verified user creates `/account_ids/800000001` with `uid` set to someone else's UID or injects an `email` field. Must return `PERMISSION_DENIED`.
8. **Malformed Path ID Poisoning** (`account_ids/bad-id` or `users/{uid}/friends/{huge1KBId}`): Attacker writes to `/account_ids/1234` (not 9 digits starting 1–9) or a 1KB friend doc ID. Must return `PERMISSION_DENIED`.
9. **Client Timestamp Forgery** (`users/{uid}/friends/{fid}`): Verified user supplies a hardcoded past/future `Date` for `createdAt` or `updatedAt` instead of `serverTimestamp()`. Must return `PERMISSION_DENIED`.
10. **Friend Owner Spoofing** (`users/{uid}/friends/{fid}`): Attacker attempts to create or list friends under another user's `/users/{victimUid}/friends`, or sets `uid != request.auth.uid`. Must return `PERMISSION_DENIED`.
11. **Value Poisoning / Oversized String** (`users/{uid}/friends/{fid}`): Verified user updates friend `remark` with a 500-char string (exceeding 40-char limit) or invalid `platform: "UnknownOS"`. Must return `PERMISSION_DENIED`.
12. **Orphaned Friend Write Without User Parent** (`users/{uid}/friends/{fid}`): Verified user without an existing `/users/{uid}` parent doc tries to create a friend doc directly. Must return `PERMISSION_DENIED`.
