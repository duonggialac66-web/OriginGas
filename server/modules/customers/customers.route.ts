import { Router } from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { customersController } from './customers.controller.js';

const router = Router();

router.get('/', authenticateToken, customersController.getCustomers);
router.post('/', authenticateToken, customersController.createCustomer);
router.put('/:id', authenticateToken, customersController.updateCustomer);
router.put('/:id/location', authenticateToken, customersController.updateLocation);
router.delete('/:id', authenticateToken, customersController.deleteCustomer);

export default router;
