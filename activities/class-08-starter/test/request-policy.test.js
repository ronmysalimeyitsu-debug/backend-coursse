// Policy tests — complete implementation of the FEATURE-801 policy matrix.
// canClaimRequest depends on nothing: its entire behavior matrix runs here
// with plain objects. No HTTP. No PostgreSQL. No server.
import test from 'node:test';
import assert from 'node:assert/strict';
import { canClaimRequest } from '../src/modules/requests/request.policy.js';

const agent = { userId: 'agent-1', role: 'agent' };
const requester = { userId: 'user-1', role: 'requester' };

const openUnassigned = {
  id: 1,
  status: 'open',
  assignedTo: null
};

test('an agent can claim an open, unassigned request', () => {
  const result = canClaimRequest({ actor: agent, request: openUnassigned });
  assert.deepEqual(result, { allowed: true });
});

test('a requester cannot claim, even an open request', () => {
  const result = canClaimRequest({ actor: requester, request: openUnassigned });
  assert.deepEqual(result, { allowed: false, reason: 'NOT_AGENT' });
});

test('an already assigned request cannot be claimed again', () => {
  const assigned = { id: 2, status: 'open', assignedTo: 'agent-2' };
  const result = canClaimRequest({ actor: agent, request: assigned });
  assert.deepEqual(result, { allowed: false, reason: 'ALREADY_ASSIGNED' });
});

test('a request that is not open cannot be claimed', () => {
  for (const status of ['in_progress', 'resolved', 'closed', 'cancelled']) {
    const req = { id: 3, status, assignedTo: null };
    const result = canClaimRequest({ actor: agent, request: req });
    assert.deepEqual(result, { allowed: false, reason: 'NOT_OPEN' }, `Failed for status ${status}`);
  }
});

test('the role rule wins over the state rules', () => {
  const assigned = { id: 4, status: 'closed', assignedTo: 'agent-2' };
  const result = canClaimRequest({ actor: requester, request: assigned });
  assert.deepEqual(result, { allowed: false, reason: 'NOT_AGENT' });
});
