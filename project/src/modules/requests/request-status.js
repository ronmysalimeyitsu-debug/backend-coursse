const RequestStatus = {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    CLOSED: 'closed'
};

const VALID_TRANSITIONS = {
    [RequestStatus.OPEN]: [RequestStatus.IN_PROGRESS, RequestStatus.CLOSED],
    [RequestStatus.IN_PROGRESS]: [RequestStatus.CLOSED],
    [RequestStatus.CLOSED]: []
};

function isValidTransition(currentStatus, newStatus) {
    return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

module.exports = { RequestStatus, isValidTransition };