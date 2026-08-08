// One-time seed script: node src/data/seedDb.js (or `npm run seed`).
// Populates MySQL with the same demo dataset the app used to run on as an
// in-memory mock (see seed.js). Users are upserted by email so this is safe
// to re-run; the sample requests/drivers/history/notifications are only
// inserted the first time (skipped once the requests table has any rows),
// since real usage is expected to grow that data afterwards.
import bcrypt from 'bcryptjs';
import { pool, query } from './db.js';
import { buildSeed, DEMO_PASSWORD } from './seed.js';

// MySQL DATETIME doesn't accept the 'T'/'Z' from JS ISO strings.
function toSqlDateTime(iso) {
  if (!iso) return null;
  return iso.slice(0, 19).replace('T', ' ');
}

function toSqlDate(iso) {
  if (!iso) return null;
  return iso.slice(0, 10);
}

async function seedUsers(users) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const idMap = {};

  for (const u of users) {
    await query(
      `INSERT INTO users (employee_id, full_name, email, password_hash, department, role, is_active, account_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name), password_hash = VALUES(password_hash),
         department = VALUES(department), role = VALUES(role), is_active = VALUES(is_active),
         account_status = 'Active'`,
      [u.employeeId, u.fullName, u.email.toLowerCase(), passwordHash, u.department, u.role, u.isActive ? 1 : 0]
    );
    const [row] = await query('SELECT id FROM users WHERE email = ?', [u.email.toLowerCase()]);
    idMap[u.id] = row.id;
  }

  // Second pass: manager_id references other users' seed ids, which we only
  // just resolved to real ids above.
  for (const u of users) {
    if (u.managerId) {
      await query('UPDATE users SET manager_id = ? WHERE id = ?', [idMap[u.managerId], idMap[u.id]]);
    }
  }

  return idMap;
}

async function seedRequests(requests, userIdMap) {
  const idMap = {};
  for (const r of requests) {
    const result = await query(
      `INSERT INTO requests (
         request_number, requester_id, request_type, status, description, business_justification,
         entry_method, current_processor_id, driver_profiles_completed_at, rpa_triggered_at,
         ad_completed_at, ad_completed_by, effective_date, submitted_date, completed_date,
         created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.requestNumber, userIdMap[r.requesterId], r.requestTypeName, r.statusName,
        r.description, r.businessJustification, r.entryMethod,
        r.currentProcessorId ? userIdMap[r.currentProcessorId] : null,
        toSqlDateTime(r.driverProfilesCompletedAt), toSqlDateTime(r.rpaTriggeredAt), toSqlDateTime(r.adCompletedAt),
        r.adCompletedBy ? userIdMap[r.adCompletedBy] : null,
        toSqlDate(r.effectiveDate), toSqlDateTime(r.submittedDate), toSqlDateTime(r.completedDate),
        toSqlDateTime(r.createdAt), toSqlDateTime(r.updatedAt),
      ]
    );
    idMap[r.id] = result.insertId;
  }
  return idMap;
}

async function seedDrivers(drivers, requestIdMap) {
  for (const d of drivers) {
    await query(
      `INSERT INTO drivers (
         request_id, username, first_name, last_name, email, phone, role, customer_group,
         driver_class, operating_hours, po_number, po_expiry, city, license_number,
         license_expiry, id_expiry, has_insurance
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestIdMap[d.requestId], d.username || null, d.firstName, d.lastName, d.email, d.phone,
        d.role, d.customerGroup || null, d.driverClass || null, d.operatingHours || null,
        d.poNumber || '', d.poExpiry || null, d.city || null, d.licenseNumber || null,
        d.licenseExpiry || null, null, d.hasInsurance || null,
      ]
    );
  }
}

async function seedHistory(history, requestIdMap, userIdMap) {
  for (const h of history) {
    await query(
      `INSERT INTO history (request_id, old_status, new_status, changed_by, remarks, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [requestIdMap[h.requestId], h.oldStatus, h.newStatus, userIdMap[h.changedBy], h.remarks, toSqlDateTime(h.createdAt)]
    );
  }
}

async function seedNotifications(notifications, requestIdMap, userIdMap) {
  for (const n of notifications) {
    await query(
      `INSERT INTO notifications (user_id, request_id, title, message, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userIdMap[n.userId], requestIdMap[n.requestId], n.title, n.message, n.isRead ? 1 : 0, toSqlDateTime(n.createdAt)]
    );
  }
}

async function main() {
  const seed = buildSeed();
  const userIdMap = await seedUsers(seed.users);
  console.log(`Seeded ${seed.users.length} users.`);

  const [{ count }] = await query('SELECT COUNT(*) AS count FROM requests');
  if (count > 0) {
    console.log('requests table already has data - skipping sample requests/drivers/history/notifications.');
  } else {
    const requestIdMap = await seedRequests(seed.requests, userIdMap);
    await seedDrivers(seed.drivers, requestIdMap);
    await seedHistory(seed.history, requestIdMap, userIdMap);
    await seedNotifications(seed.notifications, requestIdMap, userIdMap);
    console.log(`Seeded ${seed.requests.length} requests, ${seed.drivers.length} drivers, ${seed.history.length} history entries, ${seed.notifications.length} notifications.`);
  }

  await pool.end();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
