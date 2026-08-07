import { query } from '../db.js';
import { insertRow, updateRow } from '../sqlHelpers.js';

const TABLE = 'requests';
const COLUMNS = {
  requestNumber: 'request_number',
  requesterId: 'requester_id',
  requestTypeName: 'request_type',
  statusName: 'status',
  description: 'description',
  businessJustification: 'business_justification',
  entryMethod: 'entry_method',
  currentProcessorId: 'current_processor_id',
  driverProfilesCompletedAt: 'driver_profiles_completed_at',
  rpaTriggeredAt: 'rpa_triggered_at',
  adCompletedAt: 'ad_completed_at',
  adCompletedBy: 'ad_completed_by',
  effectiveDate: 'effective_date',
  submittedDate: 'submitted_date',
  completedDate: 'completed_date',
};

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    requestNumber: row.request_number,
    requesterId: row.requester_id,
    requestTypeName: row.request_type,
    statusName: row.status,
    description: row.description,
    businessJustification: row.business_justification,
    entryMethod: row.entry_method,
    currentProcessorId: row.current_processor_id,
    driverProfilesCompletedAt: row.driver_profiles_completed_at,
    rpaTriggeredAt: row.rpa_triggered_at,
    adCompletedAt: row.ad_completed_at,
    adCompletedBy: row.ad_completed_by,
    effectiveDate: row.effective_date,
    submittedDate: row.submitted_date,
    completedDate: row.completed_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

export async function create(data) {
  const id = await insertRow(TABLE, COLUMNS, data);
  return findById(id);
}

export async function update(id, patch) {
  await updateRow(TABLE, COLUMNS, id, patch);
  return findById(id);
}

// Static whitelists (mirrors the request_type / status enum columns) - kept
// synchronous since callers use them without awaiting.
export function getRequestTypes() {
  return ['Create Driver', 'Modify Driver', 'Disable Driver'];
}

export function getRequestStatuses() {
  return [
    'Submitted',
    'Under Review – Operations Team',
    'Returned to Requester',
    'Processing – Operations Team',
    'AD Team Review',
    'Completed',
    'Rejected',
  ];
}
