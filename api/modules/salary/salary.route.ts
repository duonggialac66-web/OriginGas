import { Router } from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { salaryController } from './salary.controller.js';

const router = Router();

router.get('/configs', authenticateToken, salaryController.getSalaryConfigs);
router.post('/configs', authenticateToken, salaryController.updateSalaryConfig);

router.get('/formula', authenticateToken, salaryController.getFormula);
router.post('/formula', authenticateToken, salaryController.updateFormula);
router.post('/inputs', authenticateToken, salaryController.updateMonthlyInput);

router.get('/', authenticateToken, salaryController.getCalculatedSalaries);

export default router;
