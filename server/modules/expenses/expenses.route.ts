import { Router } from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { expensesController } from './expenses.controller.js';

const router = Router();

router.get('/', authenticateToken, expensesController.getExpenses);
router.post('/', authenticateToken, expensesController.createExpense);
router.put('/:id', authenticateToken, expensesController.updateExpense);
router.delete('/:id', authenticateToken, expensesController.deleteExpense);

export default router;
