import { query } from './db.js';

// Controllers build timestamps with `new Date().toISOString()` throughout
// (a holdover from when they just landed in an in-memory object) - MySQL's
// DATETIME columns reject that 'T'/'Z' format even as a bound parameter, so
// every value passes through here before binding.
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function normalizeValue(value) {
  if (typeof value === 'string' && ISO_DATETIME_RE.test(value)) {
    return value.slice(0, 19).replace('T', ' ');
  }
  return value;
}

// Shared by every repository's create()/update(): each repo defines a
// camelCase-field -> snake_case-column map and passes it here so INSERT/
// UPDATE only ever touch the columns actually present in the given object.
export async function insertRow(table, columns, data) {
  const cols = [];
  const placeholders = [];
  const values = [];
  for (const [key, column] of Object.entries(columns)) {
    if (!(key in data)) continue;
    cols.push(column);
    placeholders.push('?');
    values.push(normalizeValue(data[key]));
  }
  const result = await query(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`, values);
  return result.insertId;
}

export async function updateRow(table, columns, id, patch) {
  const sets = [];
  const values = [];
  for (const [key, column] of Object.entries(columns)) {
    if (!(key in patch)) continue;
    sets.push(`${column} = ?`);
    values.push(normalizeValue(patch[key]));
  }
  if (!sets.length) return;
  values.push(id);
  await query(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`, values);
}
