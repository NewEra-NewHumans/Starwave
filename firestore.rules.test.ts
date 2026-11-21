/**
 * Phase 0 TDD Security Rule Test Suite for StarRipple (星涟)
 * Verifies the "Dirty Dozen" hostile payloads against firestore.rules
 * when executed against a Firestore Emulator (@firebase/rules-unit-testing).
 */
export interface DirtyDozenScenario {
  id: number;
  name: string;
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
  payload?: Record<string, unknown>;
  reason: string;
}

export const DIRTY_DOZEN_SCENARIOS: DirtyDozenScenario[] = [
  {
    id: 1,
    name: 'Unverified Email Spoof Create',
    path: '/users/attacker-uid',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: {
      uid: 'attacker-uid',
      email: 'attacker@gmail.com',
      emailProvider: 'google',
      accountId: '888888888',
      name: 'UnverifiedUser',
    },
    reason: 'request.auth.token.email_verified must be true for all writes.',
  },
  {
    id: 2,
    name: 'Orphaned User Profile Without Atomic Account Index',
    path: '/users/user-a',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: {
      uid: 'user-a',
      email: 'usera@gmail.com',
      emailProvider: 'google',
      accountId: '500000001',
      name: 'User A',
    },
    reason: 'existsAfter(/account_ids/{accountId}) enforces atomic batch/transaction creation.',
  },
  {
    id: 3,
    name: 'PII Cross-User Read',
    path: '/users/victim-uid',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
    reason: 'User email PII is strictly owner-only (request.auth.uid == userId).',
  },
  {
    id: 4,
    name: 'Directory List Scraping',
    path: '/account_ids',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
    reason: 'allow list is false on /users and /account_ids to prevent enumeration.',
  },
  {
    id: 5,
    name: 'Shadow Ghost Field Injection',
    path: '/users/user-a',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { isAdmin: true, role: 'superadmin' },
    reason: 'isValidUser() keys().hasOnly(...) and affectedKeys().hasOnly(...) block ghost fields.',
  },
  {
    id: 6,
    name: 'Exclusive Account ID Mutation',
    path: '/users/user-a',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { accountId: '999999999' },
    reason: 'accountId is immutable after registration.',
  },
  {
    id: 7,
    name: 'Account Index PII Leak & UID Spoof',
    path: '/account_ids/500000002',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: {
      accountId: '500000002',
      uid: 'victim-uid',
      email: 'leak@outlook.com',
    },
    reason: 'uid must match request.auth.uid and email is disallowed on /account_ids.',
  },
  {
    id: 8,
    name: 'Malformed Path ID Poisoning',
    path: '/account_ids/01234',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    reason: 'isValidAccountId enforces ^[1-9][0-9]{8}$ (exact 9 digits).',
  },
  {
    id: 9,
    name: 'Client Timestamp Forgery',
    path: '/users/user-a/friends/f-1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: {
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z',
    },
    reason: 'Timestamps must equal server-evaluated request.time.',
  },
  {
    id: 10,
    name: 'Cross-Tenant Friend Owner Spoofing',
    path: '/users/victim-uid/friends/f-1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { uid: 'attacker-uid', friendId: 'f-1' },
    reason: 'isOwner(userId) and data.uid == request.auth.uid block cross-user writes.',
  },
  {
    id: 11,
    name: 'Value Poisoning Oversized Remark',
    path: '/users/user-a/friends/f-1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { remark: 'x'.repeat(256) },
    reason: 'isValidFriend enforces remark.size() <= 40.',
  },
  {
    id: 12,
    name: 'Orphaned Friend Write Without User Parent',
    path: '/users/no-profile-uid/friends/f-1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    reason: 'Master Gate exists(/users/{userId}) prevents orphaned friend records.',
  },
];
