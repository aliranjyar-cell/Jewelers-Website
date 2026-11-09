import { pool } from '../../config/database.js';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../../config/env.js';

const placements = new Set(['hero', 'announcement', 'home_feature']);
const statuses = new Set(['draft', 'published', 'archived']);
const heroAlignments = new Set(['left', 'center', 'right']);
const fields = `id, title, eyebrow, body, placement, status, image_url AS imageUrl,
  mobile_image_url AS mobileImageUrl, image_alt AS imageAlt, cta_label AS ctaLabel,
  cta_url AS ctaUrl, starts_at AS startsAt, ends_at AS endsAt, priority,
  hero_alignment AS heroAlignment, hero_text_color AS heroTextColor,
  created_at AS createdAt, updated_at AS updatedAt`;
const uploadRoot = env.uploadsDirectory || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../uploads');

function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }
function text(value, limit, label, required = false) {
  const result = String(value ?? '').trim();
  if (required && !result) fail(`${label} is required.`);
  if (result.length > limit) fail(`${label} must be ${limit} characters or fewer.`);
  return result || null;
}
function dateTime(value, label) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) fail(`${label} must be a valid date and time.`);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function parse(input) {
  const campaign = {
    title: text(input.title, 120, 'Title', true), eyebrow: text(input.eyebrow, 100, 'Eyebrow'),
    body: text(input.body, 4000, 'Message'), placement: input.placement || 'hero', status: input.status || 'draft',
    imageUrl: text(input.imageUrl, 1000, 'Image URL'), mobileImageUrl: text(input.mobileImageUrl, 1000, 'Mobile image URL'),
    imageAlt: text(input.imageAlt, 200, 'Image description'), ctaLabel: text(input.ctaLabel, 60, 'Button label'),
    ctaUrl: text(input.ctaUrl, 500, 'Button link'), startsAt: dateTime(input.startsAt, 'Start time'), endsAt: dateTime(input.endsAt, 'End time'),
    priority: Number(input.priority || 0),
    heroAlignment: input.heroAlignment || 'left', heroTextColor: String(input.heroTextColor || '#F8F2E6').toUpperCase(),
  };
  if (!placements.has(campaign.placement) || !statuses.has(campaign.status)) fail('Choose a valid campaign placement and status.');
  if (campaign.ctaUrl && (!campaign.ctaUrl.startsWith('/') || campaign.ctaUrl.startsWith('//'))) fail('Campaign buttons must link to a page on this store.');
  if (!Number.isInteger(campaign.priority) || Math.abs(campaign.priority) > 10000) fail('Priority must be a whole number between -10000 and 10000.');
  if (!heroAlignments.has(campaign.heroAlignment)) fail('Choose left, center, or right alignment for the hero title.');
  if (!/^#[0-9A-F]{6}$/.test(campaign.heroTextColor)) fail('Choose a valid six-digit hero text color.');
  if (campaign.status === 'published' && campaign.placement === 'hero' && !campaign.imageUrl) fail('A hero campaign needs an image URL before publishing.');
  if (campaign.startsAt && campaign.endsAt && campaign.startsAt >= campaign.endsAt) fail('The end time must be after the start time.');
  return campaign;
}

export async function listCampaigns() {
  const [rows] = await pool.execute(`SELECT ${fields} FROM campaigns ORDER BY updated_at DESC, id DESC`);
  return rows.map((row) => ({ ...row, id: String(row.id), priority: Number(row.priority) }));
}

export async function getCampaign(placement) {
  if (!placements.has(placement)) fail('Campaign placement not found.', 404);
  const [rows] = await pool.execute(
    `SELECT ${fields} FROM campaigns WHERE placement = ? AND status = 'published'
     AND (starts_at IS NULL OR starts_at <= UTC_TIMESTAMP())
     AND (ends_at IS NULL OR ends_at > UTC_TIMESTAMP())
     ORDER BY priority DESC, updated_at DESC, id DESC LIMIT 1`, [placement],
  );
  return rows[0] ? { ...rows[0], id: String(rows[0].id), priority: Number(rows[0].priority) } : null;
}

export async function saveCampaign(id, input, adminId) {
  const c = parse(input);
  const params = [c.title, c.eyebrow, c.body, c.placement, c.status, c.imageUrl, c.mobileImageUrl, c.imageAlt,
    c.ctaLabel, c.ctaUrl, c.startsAt, c.endsAt, c.priority, c.heroAlignment, c.heroTextColor];
  if (id) {
    const [result] = await pool.execute(
      `UPDATE campaigns SET title=?, eyebrow=?, body=?, placement=?, status=?, image_url=?, mobile_image_url=?,
       image_alt=?, cta_label=?, cta_url=?, starts_at=?, ends_at=?, priority=?, hero_alignment=?, hero_text_color=? WHERE id=?`, [...params, id],
    );
    if (!result.affectedRows) fail('Campaign not found.', 404);
  } else {
    await pool.execute(
      `INSERT INTO campaigns (title, eyebrow, body, placement, status, image_url, mobile_image_url, image_alt,
       cta_label, cta_url, starts_at, ends_at, priority, hero_alignment, hero_text_color, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...params, adminId],
    );
  }
  return id ? (await listCampaigns()).find((item) => item.id === String(id)) : listCampaigns().then((items) => items[0]);
}

export async function removeCampaign(id) {
  const [result] = await pool.execute('DELETE FROM campaigns WHERE id = ?', [id]);
  if (!result.affectedRows) fail('Campaign not found.', 404);
}

export async function saveCampaignImage(dataUrl) {
  const match = typeof dataUrl === 'string' && dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) fail('Choose a JPEG, PNG, or WebP image.');
  const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > 4 * 1024 * 1024) fail('Campaign images must be 4 MB or smaller.');
  const valid = match[1] === 'image/jpeg' ? buffer[0] === 0xff && buffer[1] === 0xd8
    : match[1] === 'image/png' ? buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
      : buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  if (!valid) fail('The uploaded file is not a valid image.');
  const directory = path.resolve(uploadRoot, 'campaigns');
  await mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}.${extensions[match[1]]}`;
  await writeFile(path.join(directory, filename), buffer, { flag: 'wx' });
  return `/uploads/campaigns/${filename}`;
}
