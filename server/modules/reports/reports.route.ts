import { Router } from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { reportsController } from './reports.controller.js';

const router = Router();

router.get('/', authenticateToken, reportsController.getReports);
router.post('/', authenticateToken, reportsController.createReport);
router.put('/:id', authenticateToken, reportsController.updateReport);
router.put('/:id/payment-status', authenticateToken, reportsController.updatePaymentStatus);
router.delete('/:id', authenticateToken, reportsController.deleteReport);

export default router;
