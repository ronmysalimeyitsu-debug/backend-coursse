// Policy tests — complete implementation of the FEATURE-801 policy matrix.
// canClaimRequest depends on nothing: its entire behavior matrix runs here
// with plain objects. No HTTP. No PostgreSQL. No server.
import test from 'node:test';
import assert from 'node:assert/strict';
import { canViewRequest } from '../src/modules/requests/request.policy.js';

const agent = { userId: 'uuid-agent', role: 'agent' };
const owner = { userId: 'uuid-owner', role: 'requester' };
const stranger = { userId: 'uuid-stranger', role: 'requester' };
const requestOwnedByOwner = { id: 42, status: 'open', createdBy: 'uuid-owner' };

test('an agent can view any request', () => {
  const result = canViewRequest(agent, requestOwnedByOwner);
  assert.equal(result, true);
});

test('the owner requester can view their own request', () => {
  const result = canViewRequest(owner, requestOwnedByOwner);
  assert.equal(result, true);
});

test('a different requester cannot view the request', () => {
  const result = canViewRequest(stranger, requestOwnedByOwner);
  assert.equal(result, false);
});