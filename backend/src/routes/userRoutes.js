import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import * as userController from '../controllers/userController.js';

const router = Router();

router.get('/', authenticate, asyncHandler(userController.listUsers));

// Transporter registration approvals - Operations Manager only (Admin
// bypasses every requireRole check, see middleware/requireRole.js).
router.get('/pending', authenticate, requireRole('Operations Manager'), asyncHandler(userController.listPendingUsers));
router.post('/:id/approve', authenticate, requireRole('Operations Manager'), asyncHandler(userController.approveUser));
router.post('/:id/reject', authenticate, requireRole('Operations Manager'), asyncHandler(userController.rejectUser));

export default router;
