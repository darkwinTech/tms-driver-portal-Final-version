import { query } from '../db.js';
import { insertRow, updateRow } from '../sqlHelpers.js';

const TABLE = 'users';
const COLUMNS = {
  employeeId: 'employee_id',
  fullName: 'full_name',
  email: 'email',
  passwordHash: 'password_hash',
  department: 'department',
  role: 'role',
  managerId: 'manager_id',
  isActive: 'is_active',
  companyName: 'company_name',
  contractNumber: 'contract_number',
  accountStatus: 'account_status',
  rejectionReason: 'rejection_reason',
  reviewedBy: 'reviewed_by',
  reviewedAt: 'reviewed_at',
};

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    employeeId: row.employee_id,
    fullName: row.full_name,
    email: row.email,
    passwordHash: row.password_hash,
    department: row.department,
    role: row.role,
    managerId: row.manager_id,
    isActive: Boolean(row.is_active),
    companyName: row.company_name,
    contractNumber: row.contract_number,
    accountStatus: row.account_status,
    rejectionReason: row.rejection_reason,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAll(predicate) {
  const rows = (await query(`SELECT * FROM ${TABLE}`)).map(fromRow);
  return predicate ? rows.filter(predicate) : rows;
}

export async function findById(id) {
  if (id === null || id === undefined) return null;
  const rows = await query(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
  return fromRow(rows[0]) || null;
}

export async function findByEmail(email) {
  const normalized = String(email).toLowerCase().trim();
  const rows = await query(`SELECT * FROM ${TABLE} WHERE LOWER(email) = ?`, [normalized]);
  return fromRow(rows[0]) || null;
}

export async function findPending() {
  const rows = await query(`SELECT * FROM ${TABLE} WHERE account_status = 'Pending'`);
  return rows.map(fromRow);
}

export async function create(data) {
  const id = await insertRow(TABLE, COLUMNS, data);
  return findById(id);
}

export async function update(id, patch) {
  await updateRow(TABLE, COLUMNS, id, patch);
  return findById(id);
}
