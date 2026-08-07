import { query } from '../db.js';
import { insertRow } from '../sqlHelpers.js';

const TABLE = 'attachments';
const COLUMNS = {
  requestId: 'request_id',
  fileName: 'file_name',
  filePath: 'file_path',
  uploadedBy: 'uploaded_by',
  uploadedDate: 'uploaded_date',
  driverIndex: 'driver_index',
  docType: 'doc_type',
};

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    requestId: row.request_id,
    fileName: row.file_name,
    filePath: row.file_path,
    uploadedBy: row.uploaded_by,
    uploadedDate: row.uploaded_date,
    driverIndex: row.driver_index,
    docType: row.doc_type,
  };
}

export async function findByRequestId(requestId) {
  const rows = await query(`SELECT * FROM ${TABLE} WHERE request_id = ?`, [requestId]);
  return rows.map(fromRow);
}

export async function findById(id) {
  const rows = await query(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
  return fromRow(rows[0]) || null;
}

export async function create(data) {
  const id = await insertRow(TABLE, COLUMNS, data);
  return findById(id);
}
