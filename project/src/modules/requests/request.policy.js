export function canChangePriority(actor) {
  return actor?.role === 'agent';
}

export function canChangeStatus(actor) {
  return actor?.role === 'agent';
}

export function canEditTitle(actor, current) {
  return (
    actor?.role === 'requester' &&
    String(current.created_by) === String(actor?.userId ?? actor?.id ?? actor?.sub) &&
    current.status === 'open'
  );
}

export function canEditDescription(actor, current) {
  return (
    actor?.role === 'requester' &&
    String(current.created_by) === String(actor?.userId ?? actor?.id ?? actor?.sub) &&
    current.status === 'open'
  );
}