// Requests suite: ownership, authorization and the collection contract.
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

test('a requester can create a request and becomes its owner', async () => {
  const owner = await createUser({ name: 'owner' });
  const token = await loginAs(owner);

  const created = await createRequestAs(token, { priority: 'high' });

  assert.equal(created.createdBy, owner.id);
  assert.equal(created.status, 'open');
  assert.equal(created.priority, 'high');
});

test('the owner can read their own request', async () => {
  const owner = await createUser({ name: 'reader' });
  const token = await loginAs(owner);
  const created = await createRequestAs(token);

  const response = await request(app)
    .get(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.id, created.id);
});

test('a requester cannot access another user request', async () => {
  // Prepare
  const owner = await createUser({ name: 'victim' });
  const stranger = await createUser({ name: 'stranger' });
  const ownerToken = await loginAs(owner);
  const strangerToken = await loginAs(stranger);
  const savedRequest = await createRequestAs(ownerToken);

  // Act
  const response = await request(app)
    .get(`/requests/${savedRequest.id}`)
    .set('Authorization', `Bearer ${strangerToken}`);

  // Check
  assert.equal(response.status, 404);
});

test('the owner can read request history in chronological order', async () => {
  const owner = await createUser({ name: 'history-owner' });
  const token = await loginAs(owner);
  const created = await createRequestAs(token);

  const response = await request(app)
    .get(`/requests/${created.id}/history`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].type, 'status_changed');
  assert.equal(response.body[0].fromStatus, null);
  assert.equal(response.body[0].toStatus, 'open');
  assert.equal('changedBy' in response.body[0], false);
});

test('a stranger gets the same 404 as a missing history resource', async () => {
  const owner = await createUser({ name: 'history-victim' });
  const stranger = await createUser({ name: 'history-stranger' });
  const ownerToken = await loginAs(owner);
  const strangerToken = await loginAs(stranger);
  const created = await createRequestAs(ownerToken);

  const foreign = await request(app)
    .get(`/requests/${created.id}/history`)
    .set('Authorization', `Bearer ${strangerToken}`);
  const missing = await request(app)
    .get('/requests/999999999/history')
    .set('Authorization', `Bearer ${strangerToken}`);

  assert.equal(foreign.status, 404);
  assert.equal(missing.status, 404);
  assert.equal(foreign.body.error.code, 'REQUEST_NOT_FOUND');
  assert.equal(missing.body.error.code, 'REQUEST_NOT_FOUND');
});

test('an agent can read any request history', async () => {
  const owner = await createUser({ name: 'history-owner-agent' });
  const agent = await createUser({ name: 'history-agent', role: 'agent' });
  const ownerToken = await loginAs(owner);
  const agentToken = await loginAs(agent);
  const created = await createRequestAs(ownerToken);

  const response = await request(app)
    .get(`/requests/${created.id}/history`)
    .set('Authorization', `Bearer ${agentToken}`);

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
  assert.equal(response.body[0].type, 'status_changed');
});

test('history for a missing request returns 404', async () => {
  const owner = await createUser({ name: 'history-missing' });
  const token = await loginAs(owner);

  const response = await request(app)
    .get('/requests/999999999/history')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, 'REQUEST_NOT_FOUND');
});

test('the collection requires a Bearer token', async () => {
  const response = await request(app).get('/requests');
  assert.equal(response.status, 401);
});

test('a valid filter with no matches returns an empty array', async () => {
  const owner = await createUser({ name: 'empty-filter' });
  const token = await loginAs(owner);

  const response = await request(app)
    .get('/requests?status=closed')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, []);
});

test('a requester cannot change the priority, even of their own request', async () => {
  const owner = await createUser({ name: 'nopriority' });
  const token = await loginAs(owner);
  const created = await createRequestAs(token);

  const response = await request(app)
    .patch(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ priority: 'low' });

  assert.equal(response.status, 403);
});

test('an agent can move a request through a valid transition', async () => {
  const owner = await createUser({ name: 'transowner' });
  const agent = await createUser({ name: 'agent', role: 'agent' });
  const ownerToken = await loginAs(owner);
  const agentToken = await loginAs(agent);
  const created = await createRequestAs(ownerToken);

  const response = await request(app)
    .patch(`/requests/${created.id}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ status: 'in_progress' });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'in_progress');
});
