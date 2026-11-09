import { pool } from '../../config/database.js';

const DEFAULT_STORE_NAME = 'Zareen Jewellers';

export async function getStoreName() {
  const [rows] = await pool.execute('SELECT store_name AS storeName FROM store_settings WHERE id = 1 LIMIT 1');
  return rows[0]?.storeName || DEFAULT_STORE_NAME;
}

export async function updateStoreName(value, adminId) {
  const storeName = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (storeName.length < 2 || storeName.length > 60) {
    const error = new Error('Website name must be between 2 and 60 characters.');
    error.status = 400;
    throw error;
  }
  await pool.execute(
    `INSERT INTO store_settings (id, store_name, updated_by) VALUES (1, ?, ?)
     ON DUPLICATE KEY UPDATE store_name = VALUES(store_name), updated_by = VALUES(updated_by)`,
    [storeName, adminId],
  );
  return storeName;
}
