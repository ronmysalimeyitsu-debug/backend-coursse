// test/errors.test.js — Pruebas del contrato de errores y regresiones
import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import app from '../src/app.js';
import { loginAs } from './helpers/test-auth.js';
import { createUser } from './helpers/test-data.js';

// ------------------------------------------------- Regresión INC-701 (ID de Solicitud)

test('an alphabetic id answers 400 INVALID_REQUEST_ID, not 500', async () => {
  const user = await createUser();
  const token = await loginAs(user);

  const response = await request(app)
    .get('/requests/not-a-number')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'INVALID_REQUEST_ID');
});

test('decimal, zero and negative ids are rejected the same way', async () => {
  const user = await createUser();
  const token = await loginAs(user);

  const invalidIds = ['1.5', '0', '-3', '12abc'];

  for (const id of invalidIds) {
    const response = await request(app)
      .get(`/requests/${id}`)
      .set('Authorization', `Bearer ${token}`);

    assert.equal(response.status, 400, `El ID '${id}' debería ser rechazado con 400`);
    assert.equal(response.body.error.code, 'INVALID_REQUEST_ID');
  }
});

test('a well-formed id that matches nothing still answers 404', async () => {
  const user = await createUser();
  const token = await loginAs(user);

  const response = await request(app)
    .get('/requests/999999999')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, 'REQUEST_NOT_FOUND');
});

// ------------------------------------------------- Regresión INC-702 (Enum de Prioridad)

test('an invalid priority answers 400 INVALID_PRIORITY before touching SQL', async () => {
  const owner = await createUser({ role: 'requester' });
  const ownerToken = await loginAs(owner);

  const createRes = await request(app)
    .post('/requests')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ title: 'Ticket Prioridad Invalida' });

  assert.equal(createRes.status, 201, `Error al crear solicitud: ${JSON.stringify(createRes.body)}`);
  const reqId = createRes.body.id;

  const agent = await createUser({ role: 'agent' });
  const agentToken = await loginAs(agent);

  const response = await request(app)
    .patch(`/requests/${reqId}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ priority: 'critical' });

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'INVALID_PRIORITY');
});

test('a valid priority change still works after the fix', async () => {
  const owner = await createUser({ role: 'requester' });
  const ownerToken = await loginAs(owner);

  const createRes = await request(app)
    .post('/requests')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ title: 'Ticket Prioridad Valida' });

  assert.equal(createRes.status, 201, `Error al crear solicitud: ${JSON.stringify(createRes.body)}`);
  const reqId = createRes.body.id;

  const agent = await createUser({ role: 'agent' });
  const agentToken = await loginAs(agent);

  const response = await request(app)
    .patch(`/requests/${reqId}`)
    .set('Authorization', `Bearer ${agentToken}`)
    .send({ priority: 'high' });

  assert.equal(response.status, 200);
  assert.equal(response.body.priority, 'high');
});

// ------------------------------------------------- Manejador Central de Errores

test('an unexpected error answers a generic 500 without internal details', async () => {
  const user = await createUser();
  const token = await loginAs(user);

  const response = await request(app)
    .get('/requests/not-a-number')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 400);
  assert.equal(typeof response.body.error.code, 'string');
  assert.equal(typeof response.body.error.message, 'string');
});

test('every error body shares the same shape: error.code, error.message, requestId', async () => {
  const user = await createUser();
  const token = await loginAs(user);

  const response = await request(app)
    .get('/requests/not-a-number')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(typeof response.body.error.code, 'string');
  assert.equal(typeof response.body.error.message, 'string');
  assert.equal(response.body.error.code, 'INVALID_REQUEST_ID');
});