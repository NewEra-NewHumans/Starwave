# StarRipple (星涟) Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Verified Email Gate**: Every write across `/users`, `/account_ids`, `/users/{userId}/friends`, `/friend_requests`, `/chats`, and `/chats/{chatId}/messages` requires `request.auth != null` and `request.auth.token.email_verified == true`.
2. **PII Isolation & Zero-Scraping**:
   - `/users/{userId}` stores the user's Google/Microsoft email (`email`) and may ONLY be `get`-read by `request.auth.uid == userId`. `allow list` on `/users` is permanently `false`.
   - `/account_ids/{accountId}` contains zero PII (no `email` field) and forbids `allow list` so attackers cannot enumerate all registered users; authenticated users may only `get` a specific 9-digit ID (`^[1-9][0-9]{8}$`).
3. **Atomic ID Allocation & Mutual Friendship (`existsAfter` / `getAfter`)**:
   - A `/users/{userId}` document and its corresponding `/account_ids/{accountId}` index document MUST be created atomically in the same transaction/batch.
   - Accepting a `/friend_requests/{fromUid}_{toUid}` (`pending -> accepted`) authorizes writing the reciprocal `/users/{fromUid}/friends/uid-{toUid}` entry in the same atomic `writeBatch` via `get()` + `getAfter()`.
4. **Immutable Core Identity & Terminal State Locking**:
   - `uid`, `email`, `emailProvider`, `accountId`, `createdAt` on `/users/{userId}`, `accountId`, `uid`, `emailProvider`, `createdAt` on `/account_ids/{accountId}`, `friendId`, `uid`, `accountId`, `createdAt` on `/users/{userId}/friends/{friendId}`, `requestId`, `fromUid`, `toUid`, `createdAt` on `/friend_requests/{requestId}`, `chatId`, `kind`, `ownerUid`, `createdAt` on `/chats/{chatId}`, and `messageId`, `chatId`, `senderUid`, `senderAccountId`, `type`, `memberUids`, `createdAt` on `/chats/{chatId}/messages/{messageId}` are immutable after creation.
   - Terminal states: `friend_requests` with `status == 'accepted'` and `messages` with `recalled == true` cannot be updated or deleted further.
5. **Master Gate & Query Enforcer**:
   - Single-doc reads/writes on `/users/{userId}/friends/{friendId}` verify `exists(/databases/$(database)/documents/users/$(userId))`.
   - Single-doc reads/writes on `/chats/{chatId}/messages/{messageId}` verify `isChatMember(chatId)` (`request.auth.uid in get(/chats/{chatId}).data.memberUids`).
   - `allow list` rules on `/users/{userId}/friends`, `/friend_requests`, `/chats`, and `/chats/{chatId}/messages` evaluate `resource.data` directly against `request.auth.uid` with zero `get()`/`exists()` lookups.
6. **Temporal Integrity, Strict Keys & Payload Caps**:
   - Every create requires `createdAt == request.time && updatedAt == request.time`.
   - Every update requires `updatedAt == request.time`, `isValid[Entity]` schema validation, and `affectedKeys().hasOnly(...)`.
   - `memberUids` is bounded (`1..50` for groups, exact `2` for DMs), `content <= 4000` chars, and `imageUrl <= 250000` chars.

## 2. The "Dirty Dozen" Hostile Payloads
1. **Unverified Email Spoof Create** (`users/{uid}`): Authenticated user with `email_verified: false` tries to create `/users/{uid}`. Must return `PERMISSION_DENIED`.
2. **Orphaned User Profile Without Atomic Index** (`users/{uid}`): Verified user writes `/users/{uid}` outside a transaction without creating `/account_ids/{accountId}` in the same commit. Must return `PERMISSION_DENIED`.
3. **PII Cross-User Read** (`users/{victimUid}`): Signed-in user `attackerUid` attempts `get` on `/users/{victimUid}`. Must return `PERMISSION_DENIED`.
4. **User Directory Scraping** (`users` or `account_ids`): Signed-in user runs `list` query against `/users` or `/account_ids`. Must return `PERMISSION_DENIED`.
5. **Shadow Ghost Field Injection** (`users/{uid}`, `chats/{cid}`, `messages/{mid}`): Verified user adds `"isAdmin": true` or `"role": "owner"` in create/update payload. Must return `PERMISSION_DENIED`.
6. **Exclusive Account ID Hijacking / Mutation** (`users/{uid}`): Verified user attempts to update their `accountId` or `email` after registration. Must return `PERMISSION_DENIED`.
7. **Account Index Spoofing** (`account_ids/{accountId}`): Verified user creates `/account_ids/800000001` with `uid` set to someone else's UID or injects an `email` field. Must return `PERMISSION_DENIED`.
8. **Malformed Path ID Poisoning** (`account_ids/bad-id` or `chats/{huge1KBId}`): Attacker writes to `/account_ids/1234` or a 1KB chat/message doc ID. Must return `PERMISSION_DENIED`.
9. **Client Timestamp Forgery** (`users/{uid}/friends/{fid}`, `chats/{cid}/messages/{mid}`): Verified user supplies a hardcoded past/future `Date` for `createdAt` or `updatedAt` instead of `serverTimestamp()`. Must return `PERMISSION_DENIED`.
10. **Friend Request Forgery & Self-Approval** (`friend_requests/{fromUid}_{toUid}`): Sender attempts to set `status: 'accepted'` directly on create or approve their own outgoing request. Must return `PERMISSION_DENIED`.
11. **Chat Non-Member Eavesdrop / Message Spoofing** (`chats/{cid}/messages/{mid}`): Non-member queries or writes messages, or member sends message with `senderUid != request.auth.uid`, or recalls another user's message. Must return `PERMISSION_DENIED`.
12. **Value Poisoning / Oversized Media & Orphaned Write** (`chats/{cid}/messages/{mid}`): Verified user sends >250KB `imageUrl` or >4000-char `content`, or writes message to non-existent parent chat. Must return `PERMISSION_DENIED`.
