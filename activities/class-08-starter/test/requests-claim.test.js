// API tests for FEATURE-801 — Claim a request.
// Behavior matrix of the claim action through HTTP.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { createUser, createRequestAs } from './helpers/test-data.js';
import { loginAs } from './helpers/test-auth.js';
import { cleanupCreatedData, closePool } from './helpers/cleanup.js';

after(async () => {
  await cleanupCreatedData();
  await closePool();
});

test('claim requires authentication', async () => {
  const response = await request(app).post('/requests/1/claim');
  assert.equal(response.status, 401);
});

test('a requester cannot claim a request', async () => {
  const requester = await createUser({ name: 'claim-requester' });
  const token = await loginAs(requester);
  const created = await createRequestAs(token);

  const response = await request(app)
    .post(`/requests/${created.id}/claim`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 403);
});

test('an agent claims an open request: 200, assignedTo from the token, in_progress', async () => {
  const requester = await createUser({ name: 'claim-owner' });
  const agent = await createUser({ name: 'claim-agent', role: 'agent' });
  const reqToken = await loginAs(requester);
  const agentToken = await loginAs(agent);

  const created = await createRequestAs(reqToken);

  const response = await request(app)
    .post(`/requests/${created.id}/claim`)
    .set('Authorization', `Bearer ${agentToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'in_progress');
  assert.equal(response.body.assignedTo, agent.id);
  assert.ok(new Date(response.body.updatedAt) >= new Date(created.updatedAt));
});

test('claiming a nonexistent request answers 404', async () => {
  const agent = await createUser({ name: 'claim-agent404', role: 'agent' });
  const agentToken = await loginAs(agent);

  const response = await request(app)
    .post('/requests/999999999/claim')
    .set('Authorization', `Bearer ${agentToken}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.error?.code, 'REQUEST_NOT_FOUND');
});

test('a second claim answers 409 REQUEST_ALREADY_ASSIGNED', async () => {
  const requester = await createUser({ name: 'claim-owner2' });
  const agent1 = await createUser({ name: 'claim-agent1', role: 'agent' });
  const agent2 = await createUser({ name: 'claim-agent2', role: 'agent' });
  const reqToken = await loginAs(requester);
  const token1 = await loginAs(agent1);
  const token2 = await loginAs(agent2);

  const created = await createRequestAs(reqToken);

  const first = await request(app)
    .post(`/requests/${created.id}/claim`)
    .set('Authorization', `Bearer ${token1}`);
  assert.equal(first.status, 200);

  const second = await request(app)
    .post(`/requests/${created.id}/claim`)
    .set('Authorization', `Bearer ${token2}`);
  assert.equal(second.status, 409);
  assert.equal(second.body.error?.code, 'REQUEST_ALREADY_ASSIGNED');
  assert.ok(typeof second.body.requestId === 'string');
});

test('a terminal request cannot be claimed', async () => {
  const requester = await createUser({ name: 'term-owner' });
  const agent = await createUser({ name: 'term-agent', role: 'agent' });
  const reqToken = await loginAs(requester);
  const agentToken = await loginAs(agent);

  const created = await createRequestAs(reqToken);

  const cancel = await request(app)
    .patch(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ status: 'cancelled' });
  assert.equal(cancel.status, 200);

  const response = await request(app)
    .post(`/requests/${created.id}/claim`)
    .set('Authorization', `Bearer ${agentToken}`);
  assert.equal(response.status, 409);
});

test('in_progress, resolved and closed requests cannot be claimed', async () => {
  const requester = await createUser({ name: 'state-owner' });
  const agent = await createUser({ name: 'state-agent', role: 'agent' });
  const reqToken = await loginAs(requester);
  const agentToken = await loginAs(agent);
  const scenarios = [
    { status: 'in_progress', transitions: ['in_progress'], error: 'INVALID_STATUS_TRANSITION' },
    { status: 'resolved', transitions: ['in_progress', 'resolved'], error: 'INVALID_STATUS_TRANSITION' },
    { status: 'closed', transitions: ['in_progress', 'resolved', 'closed'], error: 'REQUEST_IN_TERMINAL_STATUS' }
  ];

  for (const scenario of scenarios) {
    const created = await createRequestAs(reqToken);
    for (const status of scenario.transitions) {
      const transition = await request(app)
        .patch(`/requests/${created.id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ status });
      assert.equal(transition.status, 200, `could not prepare ${scenario.status}`);
    }

    const response = await request(app)
      .post(`/requests/${created.id}/claim`)
      .set('Authorization', `Bearer ${agentToken}`);

    assert.equal(response.status, 409, `claim of ${scenario.status} should conflict`);
    assert.equal(response.body.error?.code, scenario.error);
  }
});

test('assignedTo in the body is rejected as a server-controlled field', async () => {
  const requester = await createUser({ name: 'ctrl-owner' });
  const agent = await createUser({ name: 'ctrl-agent', role: 'agent' });
  const reqToken = await loginAs(requester);
  const agentToken = await loginAs(agent);

  const created = await createRequestAs(reqToken);

  const response = await request(app)
    .post(`/requests/${created.id}/claim`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ assignedTo: agent.id });

  assert.equal(response.status, 400);
  assert.equal(response.body.error?.code, 'SERVER_CONTROLLED_FIELD');
});

test('the claim leaves a request_claimed event in the history', async () => {
  const requester = await createUser({ name: 'hist-owner' });
  const agent = await createUser({ name: 'hist-agent', role: 'agent' });
  const reqToken = await loginAs(requester);
  const agentToken = await loginAs(agent);

  const created = await createRequestAs(reqToken);

  const claim = await request(app)
    .post(`/requests/${created.id}/claim`)
    .set('Authorization', `Bearer ${agentToken}`);
  assert.equal(claim.status, 200);

  const history = await request(app)
    .get(`/requests/${created.id}/history`)
    .set('Authorization', `Bearer ${reqToken}`);
  assert.equal(history.status, 200);

  const claimEvent = history.body.find((e) => e.type === 'request_claimed');
  assert.ok(claimEvent);
  assert.equal(claimEvent.fromStatus, 'open');
  assert.equal(claimEvent.toStatus, 'in_progress');
});
