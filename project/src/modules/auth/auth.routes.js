import { Router } from 'express';
import { register, login, getCurrentUser } from './auth.service.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const result = await register(req.body);
    res.status(201).json(result);
  } catch (err) {
    const code = err.code || 'VALIDATION_ERROR';
    res.status(err.status || err.statusCode || 400).json({
      code,
      error: { code, message: err.message },
      message: err.message
    });
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const result = await login(req.body);
    res.status(200).json(result);
  } catch (err) {
    const code = err.code || 'INVALID_CREDENTIALS';
    res.status(err.status || err.statusCode || 401).json({
      code,
      error: { code, message: err.message },
      message: err.message
    });
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.auth.userId);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

export default router;