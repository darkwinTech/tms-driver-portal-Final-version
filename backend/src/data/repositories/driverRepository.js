import { query } from '../db.js';
import { insertRow, updateRow } from '../sqlHelpers.js';

const TABLE = 'drivers';
const COLUMNS = {
  requestId: 'request_id',
  username: 'username',
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  phone: 'phone',
  role: 'role',
  customerGroup: 'customer_group',
  driverClass: 'driver_class',
  operatingHours: 'operating_hours',
  poNumber: 'po_number',
  poExpiry: 'po_expiry',
  city: 'city',
  licenseNumber: 'license_number',
  licenseExpiry: 'license_expiry',
  IDExpiry: 'id_expiry',
  hasInsurance: 'has_insurance',
  changeSummary: 'change_summary',
  driverStatus: 'driver_status',
};

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    requestId: row.request_id,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    customerGroup: row.customer_group,
    driverClass: row.driver_class,
    operatingHours: row.operating_hours,
    poNumber: row.po_number,
    poExpiry: row.po_expiry,
    city: row.city,
    licenseNumber: row.license_number,
    licenseExpiry: row.license_expiry,
    IDExpiry: row.id_expiry,
    hasInsurance: row.has_insurance,
    changeSummary: row.change_summary,
    driverStatus: row.driver_status,
    createdAt: row.created_at,
  };
}

export async function findAll(predicate) {
  const rows = (await query(`SELECT * FROM ${TABLE}`)).map(fromRow);
  return predicate ? rows.filter(predicate) : rows;
}

export async function findById(id) {
  const rows = await query(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
  return fromRow(rows[0]) || null;
}

export async function findByRequestId(requestId) {
  const rows = await query(`SELECT * FROM ${TABLE} WHERE request_id = ?`, [requestId]);
  return rows.map(fromRow);
}

export async function create(data) {
  const id = await insertRow(TABLE, COLUMNS, data);
  return findById(id);
}

export async function bulkCreate(rows) {
  return Promise.all(rows.map((row) => create(row)));
}

export async function update(id, patch) {
  await updateRow(TABLE, COLUMNS, id, patch);
  return findById(id);
}

export async function removeByRequestId(requestId) {
  await query(`DELETE FROM ${TABLE} WHERE request_id = ?`, [requestId]);
}
