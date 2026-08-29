export const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'cancelled'];
export const TERMINAL_STATUSES = ['closed', 'cancelled'];

const ALLOWED_TRANSITIONS = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['resolved', 'cancelled'],
  resolved: ['closed'],
  closed: [],
  cancelled: []
};

export function isValidStatus(status) {
  return VALID_STATUSES.includes(status);
}

export function isTerminal(status) {
  return TERMINAL_STATUSES.includes(status);
}

export function canTransition(currentStatus, nextStatus) {
  return ALLOWED_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
}