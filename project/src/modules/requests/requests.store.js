const requests = [];
let currentId = 1;

export const requestsStore = {
  getAll: () => requests,
  getById: (id) => requests.find(r => r.id === Number(id)),
  create: (data) => {
    const newRequest = {
      id: currentId++,
      title: data.title,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    requests.push(newRequest);
    return newRequest;
  },
  updateStatus: (id, newStatus) => {
    const item = requests.find(r => r.id === Number(id));
    if (item) {
      item.status = newStatus;
      item.updatedAt = new Date().toISOString();
    }
    return item;
  }
};