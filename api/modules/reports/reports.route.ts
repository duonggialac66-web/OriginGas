import { Router } from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { reportsController } from './reports.controller.js';

const router = Router();

router.get('/', authenticateToken, reportsController.getReports);
router.post('/', authenticateToken, reportsController.createReport);

export default router;
