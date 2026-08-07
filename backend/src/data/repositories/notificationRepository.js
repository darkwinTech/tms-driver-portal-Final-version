import { query } from '../db.js';
import { insertRow } from '../sqlHelpers.js';

const TABLE = 'notifications';
const COLUMNS = {
  userId: 'user_id',
  requestId: 'request_id',
  title: 'title',
  message: 'message',
  isRead: 'is_read',
};

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    requestId: row.request_id,
    title: row.title,
    message: row.message,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

export async function findByUserId(userId) {
  const rows = await query(`SELECT * FROM ${TABLE} WHERE user_id = ?`, [userId]);
  return rows.map(fromRow);
}

export async function create(data) {
  const id = await insertRow(TABLE, COLUMNS, data);
  const rows = await query(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
  return fromRow(rows[0]);
}

export async function markAllReadForUser(userId) {
  await query(`UPDATE ${TABLE} SET is_read = 1 WHERE user_id = ?`, [userId]);
}
