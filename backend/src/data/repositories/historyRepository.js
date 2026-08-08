import { query } from '../db.js';
import { insertRow } from '../sqlHelpers.js';

const TABLE = 'history';
const COLUMNS = {
  requestId: 'request_id',
  oldStatus: 'old_status',
  newStatus: 'new_status',
  changedBy: 'changed_by',
  remarks: 'remarks',
};

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    requestId: row.request_id,
    oldStatus: row.old_status,
    newStatus: row.new_status,
    changedBy: row.changed_by,
    remarks: row.remarks,
    createdAt: row.created_at,
  };
}

export async function findByRequestId(requestId) {
  const rows = await query(`SELECT * FROM ${TABLE} WHERE request_id = ?`, [requestId]);
  return rows.map(fromRow);
}

export async function create(data) {
  const id = await insertRow(TABLE, COLUMNS, data);
  const rows = await query(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
  return fromRow(rows[0]);
}
