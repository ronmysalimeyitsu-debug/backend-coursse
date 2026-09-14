import { withTransaction } from '../../database/transaction.js';
import { 
  canChangePriority, 
  canChangeStatus, 
  canEditTitle, 
  canEditDescription 
} from './request.policy.js';
import {
  findAll,
  findById,
  insertRequest,
  updateRequest,
  insertStatusHistory,
  findHistory
} from './requests.store.js';
import { mapRequestRow, mapHistoryRow } from './request.mapper.js';
import { STATUSES, isValidStatus, isTerminal, canTransition } from './request-status.js';
import { AppError } from '../../app-error.js';

const PRIORITIES = ['low', 'medium', 'high'];
const UPDATABLE_FIELDS = ['title', 'description', 'priority', 'status'];
const SERVER_CONTROLLED_FIELDS_ON_CREATE = ['id', 'createdBy', 'createdAt', 'updatedAt', 'changedBy', 'status'];

function assertValidPriority(priority) {
  if (!PRIORITIES.includes(priority)) {
    throw new AppError('contract', 'INVALID_PRIORITY',
      `Unknown priority "${priority}". Valid values: ${PRIORITIES.join(', ')}.`);
  }
}

function rejectServerControlledFields(input, forbiddenFields) {
  if (!input) return;
  for (const field of forbiddenFields) {
    if (input[field] !== undefined) {
      throw new AppError('contract', 'SERVER_CONTROLLED_FIELD',
        `Field "${field}" is controlled by the server and cannot be provided.`);
    }
  }
}

function getActorId(actor) {
  return actor?.userId ?? actor?.id ?? actor?.sub ?? null;
}

export async function listRequests(actor, filters = {}) {
  if (filters.status !== undefined && !isValidStatus(filters.status)) {
    throw new AppError('contract', 'INVALID_FILTER',
      `Unknown status "${filters.status}". Valid values: ${STATUSES.join(', ')}.`);
  }
  if (filters.priority !== undefined && !PRIORITIES.includes(filters.priority)) {
    throw new AppError('contract', 'INVALID_FILTER',
      `Unknown priority "${filters.priority}". Valid values: ${PRIORITIES.join(', ')}.`);
  }

  const effectiveFilters = { ...filters };
  if (actor?.role === 'requester') {
    effectiveFilters.createdBy = getActorId(actor);
  }

  const rows = await findAll(effectiveFilters);
  return rows.map(mapRequestRow);
}

export async function getRequest(actor, id) {
  const row = await findById(id);
  const userId = getActorId(actor);

  if (!row) {
    throw new AppError('resource', 'REQUEST_NOT_FOUND', `Request ${id} does not exist.`);
  }

  if (actor?.role === 'requester' && String(row.created_by) !== String(userId)) {
    throw new AppError('resource', 'REQUEST_NOT_FOUND', `Request ${id} does not exist.`);
  }

  return mapRequestRow(row);
}

export async function createRequest(actor, input) {
  rejectServerControlledFields(input, SERVER_CONTROLLED_FIELDS_ON_CREATE);

  const { title, description, priority } = input ?? {};
  const userId = getActorId(actor);

  if (typeof title !== 'string' || title.trim() === '') {
    throw new AppError('contract', 'TITLE_REQUIRED', 'A request needs a non-empty title.');
  }
  if (priority !== undefined) assertValidPriority(priority);

  const row = await withTransaction(async (client) => {
    const created = await insertRequest({
      title: title.trim(),
      description: typeof description === 'string' ? description : null,
      priority: priority ?? 'medium',
      createdBy: userId
    }, client);
    await insertStatusHistory(created.id, null, created.status, client, userId);
    return created;
  });

  return mapRequestRow(row);
}

export async function patchRequest(actor, id, body) {
  rejectServerControlledFields(body, ['id', 'createdBy', 'createdAt', 'updatedAt', 'changedBy']);

  const userId = getActorId(actor);
  const changes = {};
  for (const field of UPDATABLE_FIELDS) {
    if (body?.[field] !== undefined) changes[field] = body[field];
  }

  if (Object.keys(changes).length === 0) {
    throw new AppError('contract', 'NO_UPDATABLE_FIELDS',
      `The body must include at least one of: ${UPDATABLE_FIELDS.join(', ')}.`);
  }
  if (changes.title !== undefined && (typeof changes.title !== 'string' || changes.title.trim() === '')) {
    throw new AppError('contract', 'TITLE_REQUIRED', 'The title cannot be empty.');
  }
  if (changes.title !== undefined) {
    changes.title = changes.title.trim();
  }
  if (changes.priority !== undefined) {
    assertValidPriority(changes.priority);
  }
  if (changes.status !== undefined && !isValidStatus(changes.status)) {
    throw new AppError('contract', 'INVALID_STATUS', `Unknown status "${changes.status}".`);
  }

  const row = await withTransaction(async (client) => {
    const current = await findById(id, client);

    if (!current) {
      throw new AppError('resource', 'REQUEST_NOT_FOUND', `Request ${id} does not exist.`);
    }
    if (actor?.role === 'requester' && String(current.created_by) !== String(userId)) {
      throw new AppError('resource', 'REQUEST_NOT_FOUND', `Request ${id} does not exist.`);
    }

    if (isTerminal(current.status)) {
      throw new AppError('domain', 'REQUEST_IN_TERMINAL_STATUS',
        `Request ${id} is ${current.status} and can no longer be modified.`);
    }
    const statusChanges = changes.status !== undefined && changes.status !== current.status;
    if (statusChanges && !canTransition(current.status, changes.status)) {
      throw new AppError('domain', 'INVALID_STATUS_TRANSITION',
        `A request cannot move from ${current.status} to ${changes.status}.`);
    }

    if (changes.title !== undefined && !canEditTitle(actor, current)) {
      throw new AppError('forbidden', 'FORBIDDEN', 'You do not have permission to edit the title.');
    }
    if (changes.description !== undefined && !canEditDescription(actor, current)) {
      throw new AppError('forbidden', 'FORBIDDEN', 'You do not have permission to edit the description.');
    }
    if (changes.priority !== undefined && !canChangePriority(actor)) {
      throw new AppError('forbidden', 'FORBIDDEN', 'You do not have permission to change the priority.');
    }
    if (changes.status !== undefined && !canChangeStatus(actor)) {
      throw new AppError('forbidden', 'FORBIDDEN', 'You do not have permission to change the status.');
    }

    const updated = await updateRequest(id, changes, client);
    
    if (statusChanges) {
      await insertStatusHistory(id, current.status, changes.status, client, userId);
    }
    return updated;
  });

  return mapRequestRow(row);
}

export async function getHistory(actor, id) {
  const request = await findById(id);
  const userId = getActorId(actor);

  if (!request) {
    throw new AppError('resource', 'REQUEST_NOT_FOUND', `Request ${id} does not exist.`);
  }

  if (actor?.role === 'requester' && String(request.created_by) !== String(userId)) {
    throw new AppError('resource', 'REQUEST_NOT_FOUND', `Request ${id} does not exist.`);
  }

  const rows = await findHistory(id);
  return rows.map(mapHistoryRow);
}