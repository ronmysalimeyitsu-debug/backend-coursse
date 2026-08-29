import express from 'express';
import requestsRouter from './modules/requests/requests.routes.js';

const app = express();

app.use(express.json());
app.use('/requests', requestsRouter);

export default app;