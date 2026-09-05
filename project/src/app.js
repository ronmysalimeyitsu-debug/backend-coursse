const express = require('express');
const requestsRoutes = require('./modules/requests/requests.routes');

const app = express();

app.use(express.json());
app.use('/requests', requestsRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    const status = err.statusCode || 500;
    res.status(status).json({
        error: {
            message: err.message || 'Internal Server Error',
            status
        }
    });
});

module.exports = app;