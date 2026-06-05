import { Router } from 'express';
import { authenticateToken } from '../../middleware/authMiddleware';
import { reportsController } from './reports.controller';

const router = Router();

router.get('/', authenticateToken, reportsController.getReports);
router.post('/', authenticateToken, reportsController.createReport);

export default router;
