import { pool } from '../../config/database.js';

function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }

function validate(input) {
  const metal = String(input.metal || '').trim().toLowerCase();
  const purity = String(input.purity || '').trim();
  const rate = Number(input.rate);
  if (!['gold', 'silver'].includes(metal)) fail('Choose gold or silver.');
  if (!purity || purity.length > 40) fail('Enter a purity label of up to 40 characters.');
  if (!Number.isFinite(rate) || rate <= 0 || rate > 9999999999.99) fail('Enter a valid rate greater than zero.');
  return { metal, purity, rate: Math.round(rate * 100) / 100 };
}

export async function listMetalRates() {
  const [rows] = await pool.execute(
    `SELECT mr.id, mr.metal_type AS metal, mr.purity, mr.rate_per_gram_pkr AS rate,
     mr.effective_at AS updatedAt, mr.created_at AS createdAt, u.full_name AS updatedBy
     FROM metal_rates mr LEFT JOIN users u ON u.id = mr.created_by
     WHERE mr.effective_at = (SELECT MAX(latest.effective_at) FROM metal_rates latest
       WHERE latest.metal_type = mr.metal_type AND latest.purity = mr.purity)
     ORDER BY mr.metal_type, mr.purity`,
  );
  return rows.map((row) => ({ ...row, id: String(row.id), rate: Number(row.rate) }));
}

export async function listMetalRateHistory(limit = 30) {
  const [rows] = await pool.execute(
    `SELECT mr.id, mr.metal_type AS metal, mr.purity, mr.rate_per_gram_pkr AS rate,
     mr.effective_at AS updatedAt, mr.created_at AS createdAt, u.full_name AS updatedBy
     FROM metal_rates mr LEFT JOIN users u ON u.id = mr.created_by
     ORDER BY mr.effective_at DESC, mr.id DESC LIMIT ?`, [limit],
  );
  return rows.map((row) => ({ ...row, id: String(row.id), rate: Number(row.rate) }));
}

export async function saveMetalRate(input, adminId) {
  const { metal, purity, rate } = validate(input);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      'SELECT effective_at FROM metal_rates WHERE metal_type = ? AND purity = ? ORDER BY effective_at DESC LIMIT 1 FOR UPDATE', [metal, purity],
    );
    const now = new Date();
    const last = rows[0]?.effective_at ? new Date(rows[0].effective_at) : null;
    const effectiveAt = last && last >= now ? new Date(last.getTime() + 1000) : now;
    const [result] = await connection.execute(
      'INSERT INTO metal_rates (metal_type, purity, rate_per_gram_pkr, effective_at, created_by) VALUES (?, ?, ?, ?, ?)',
      [metal, purity, rate, effectiveAt, adminId],
    );
    await connection.commit();
    return { id: String(result.insertId), metal, purity, rate, updatedAt: effectiveAt, unit: 'gram' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}
