import { Router } from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { usersController } from './users.controller.js';

const router = Router();

router.get('/', authenticateToken, usersController.getEmployees);
router.post('/', authenticateToken, usersController.createEmployee);
router.put('/:id', authenticateToken, usersController.updateEmployee);
router.delete('/:id', authenticateToken, usersController.deleteEmployee);

export default router;
