import { ApiError } from '../utils/ApiError.js';
import { userRepository } from '../data/index.js';
import { sendApprovalEmail, sendRejectionEmail } from '../services/registrationEmailService.js';

export async function listUsers(req, res) {
  const { role } = req.query;
  const rows = await userRepository.findAll(role ? (u) => u.role === role : undefined);
  const shaped = rows
    .map((u) => ({ id: u.id, fullName: u.fullName, email: u.email, department: u.department, managerId: u.managerId }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  res.json(shaped);
}

// ---------------------------------------------------------------------------
// Transporter registration approvals - Operations Manager (+ Admin) only.
export async function listPendingUsers(req, res) {
  const rows = await userRepository.findPending();
  const shaped = rows
    .map((u) => ({
      id: u.id, fullName: u.fullName, email: u.email, companyName: u.companyName,
      contractNumber: u.contractNumber, createdAt: u.createdAt,
    }))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(shaped);
}

async function findPendingUserOr404(id) {
  const user = await userRepository.findById(id);
  if (!user || user.accountStatus !== 'Pending') {
    throw new ApiError('Pending registration not found', 404);
  }
  return user;
}

export async function approveUser(req, res) {
  const user = await findPendingUserOr404(req.params.id);
  const updated = await userRepository.update(user.id, {
    accountStatus: 'Active',
    reviewedBy: req.user.id,
    reviewedAt: new Date().toISOString(),
  });
  await sendApprovalEmail(updated);
  res.json({ id: updated.id, accountStatus: updated.accountStatus });
}

export async function rejectUser(req, res) {
  const user = await findPendingUserOr404(req.params.id);
  const { reason } = req.body;
  const updated = await userRepository.update(user.id, {
    accountStatus: 'Rejected',
    rejectionReason: reason || null,
    reviewedBy: req.user.id,
    reviewedAt: new Date().toISOString(),
  });
  await sendRejectionEmail(updated, reason);
  res.json({ id: updated.id, accountStatus: updated.accountStatus });
}