import { Router } from 'express';
import { authenticateToken } from '../../middleware/authMiddleware';
import { usersController } from './users.controller';

const router = Router();

router.get('/', authenticateToken, usersController.getEmployees);
router.post('/', authenticateToken, usersController.createEmployee);
router.put('/:id', authenticateToken, usersController.updateEmployee);
router.delete('/:id', authenticateToken, usersController.deleteEmployee);

export default router;
