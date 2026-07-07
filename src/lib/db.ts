import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import { getPool } from "./mysql";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type SocialLinks = {
  instagram?: string | null;
  tiktok?: string | null;
  x?: string | null;
  facebook?: string | null;
  youtube?: string | null;
};

export type Creator = {
  id: string;
  ownerUserId: string | null;
  displayName: string;
  slug: string;
  role: string | null;
  locationName: string | null;
  photoUrl: string | null;
  mpAlias: string | null;
  commissionPercent: number;
  mpUserId: string | null;
  mpNickname: string | null;
  mpEmail: string | null;
  mpSiteId: string | null;
  mpFirstName: string | null;
  mpLastName: string | null;
  mpCountryId: string | null;
  mpPermalink: string | null;
  mpAccessToken: string | null;
  mpRefreshToken: string | null;
  mpTokenExpiresAt: string | null;
  socialLinks: SocialLinks | null;
  thankYouMessage: string | null;
  isActive: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreatorQrCode = {
  id: string;
  creatorId: string | null;
  qrId: string;
  isAutoInstallable: boolean;
  isBulkPrint: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserRole = "admin" | "creator";

export type User = {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: UserRole;
  creatorId: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

export type Tip = {
  id: string;
  creatorId: string;
  amountCents: number;
  platformFeeCents: number;
  currency: string;
  status: string;
  preferenceId: string | null;
  paymentId: string | null;
  externalReference: string;
  checkoutUrl: string | null;
  payerEmail: string | null;
  rawPayment: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentEvent = {
  id: string;
  tipId: string | null;
  eventType: string;
  payload: string;
  createdAt: string;
};

export type Notification = {
  id: string;
  creatorId: string;
  title: string;
  body: string | null;
  photoUrl?: string | null;
  imageUrl?: string | null;
  isRead: boolean;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export const ADMIN_NOTIFICATIONS_ID = "__admin__";

export type AppSettings = {
  showMercadoPagoIntegration: boolean;
  transferDiscountPercent: number;
  colorOverrides: Record<string, string>;
  updatedAt: string | null;
};

export type StorageInfo = {
  dbPath: string;
  backupDir: string;
  exists: boolean;
  sizeBytes: number;
  updatedAt: string | null;
};

export type CreatorWithTips = Creator & {
  qrCodes: CreatorQrCode[];
  tips: Tip[];
};

export type TipWithCreator = Tip & {
  creator: Creator;
};

export type QrCodeWithCreator = CreatorQrCode & {
  creator: Creator;
};

// ═══════════════════════════════════════════════════════════════════════════
// Pure helpers
// ═══════════════════════════════════════════════════════════════════════════

function now() {
  return new Date().toISOString();
}

function toMySQL(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toISOString().slice(0, 19).replace("T", " ");
}

function fromMySQL(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

function parseJSON<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "object") return value as T;
  try { return JSON.parse(value as string) as T; } catch { return fallback; }
}

function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

function adminEmails() {
  return (process.env.ADMIN_GOOGLE_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((e) => normalizedEmail(e))
    .filter(Boolean);
}

function emailIsAdmin(email: string) {
  return adminEmails().includes(normalizedEmail(email));
}

function normalizeTransferDiscountPercent(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 40) return 5;
  return parsed;
}

function defaultSettings(timestamp = now()): AppSettings {
  return {
    showMercadoPagoIntegration: true,
    transferDiscountPercent: 5,
    colorOverrides: {},
    updatedAt: timestamp,
  };
}

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 42) || "creador"
  );
}

export function normalizeMercadoPagoAlias(value: string) {
  return value.trim().toLowerCase();
}

function validateMercadoPagoAlias(value: string) {
  const alias = normalizeMercadoPagoAlias(value);
  if (!alias) throw new Error("Ingresa un alias de Mercado Pago.");
  if (!/^[a-z0-9](?:[a-z0-9.-]{4,38}[a-z0-9])$/.test(alias))
    throw new Error("Usa entre 6 y 40 caracteres: letras, números, punto o guion.");
  return alias;
}

export function normalizeQrId(value: string) {
  return value.trim().toLowerCase();
}

function validateQrId(value: string) {
  const qrId = normalizeQrId(value);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(qrId))
    throw new Error("El ID del QR solo puede tener letras, números y guiones.");
  if (qrId.length > 64)
    throw new Error("El ID del QR no puede superar 64 caracteres.");
  return qrId;
}

export function isApprovedTip(tip: Pick<Tip, "status">) {
  return tip.status === "approved";
}

// ═══════════════════════════════════════════════════════════════════════════
// Row mappers
// ═══════════════════════════════════════════════════════════════════════════

function rowToCreator(r: RowDataPacket): Creator {
  return {
    id: r.id,
    ownerUserId: r.owner_user_id ?? null,
    displayName: r.display_name,
    slug: r.slug,
    role: r.role ?? null,
    locationName: r.location_name ?? null,
    photoUrl: r.photo_url ?? null,
    mpAlias: r.mp_alias ?? null,
    commissionPercent: Number(r.commission_percent),
    mpUserId: r.mp_user_id ?? null,
    mpNickname: r.mp_nickname ?? null,
    mpEmail: r.mp_email ?? null,
    mpSiteId: r.mp_site_id ?? null,
    mpFirstName: r.mp_first_name ?? null,
    mpLastName: r.mp_last_name ?? null,
    mpCountryId: r.mp_country_id ?? null,
    mpPermalink: r.mp_permalink ?? null,
    mpAccessToken: r.mp_access_token ?? null,
    mpRefreshToken: r.mp_refresh_token ?? null,
    mpTokenExpiresAt: fromMySQL(r.mp_token_expires_at),
    socialLinks: parseJSON<SocialLinks | null>(r.social_links, null),
    thankYouMessage: r.thank_you_message ?? null,
    isActive: Boolean(r.is_active),
    onboardingCompleted: Boolean(r.onboarding_completed),
    createdAt: fromMySQL(r.created_at) ?? now(),
    updatedAt: fromMySQL(r.updated_at) ?? now(),
  };
}

function rowToUser(r: RowDataPacket): User {
  return {
    id: r.id,
    email: r.email,
    name: r.name ?? null,
    picture: r.picture ?? null,
    role: r.role as UserRole,
    creatorId: r.creator_id ?? null,
    createdAt: fromMySQL(r.created_at) ?? now(),
    updatedAt: fromMySQL(r.updated_at) ?? now(),
    lastLoginAt: fromMySQL(r.last_login_at),
  };
}

function rowToQrCode(r: RowDataPacket): CreatorQrCode {
  return {
    id: r.id,
    creatorId: r.creator_id ?? null,
    qrId: r.qr_id,
    isAutoInstallable: Boolean(r.is_auto_installable),
    isBulkPrint: Boolean(r.is_bulk_print),
    createdAt: fromMySQL(r.created_at) ?? now(),
    updatedAt: fromMySQL(r.updated_at) ?? now(),
  };
}

function rowToTip(r: RowDataPacket): Tip {
  return {
    id: r.id,
    creatorId: r.creator_id,
    amountCents: r.amount_cents,
    platformFeeCents: r.platform_fee_cents,
    currency: r.currency,
    status: r.status,
    preferenceId: r.preference_id ?? null,
    paymentId: r.payment_id ?? null,
    externalReference: r.external_reference,
    checkoutUrl: r.checkout_url ?? null,
    payerEmail: r.payer_email ?? null,
    rawPayment: r.raw_payment ?? null,
    createdAt: fromMySQL(r.created_at) ?? now(),
    updatedAt: fromMySQL(r.updated_at) ?? now(),
  };
}

function rowToNotification(r: RowDataPacket): Notification {
  return {
    id: r.id,
    creatorId: r.creator_id,
    title: r.title,
    body: r.body ?? null,
    photoUrl: r.photo_url ?? null,
    imageUrl: r.image_url ?? null,
    isRead: Boolean(r.is_read),
    isVisible: Boolean(r.is_visible),
    createdAt: fromMySQL(r.created_at) ?? now(),
    updatedAt: fromMySQL(r.updated_at) ?? now(),
  };
}

function rowToSettings(r: RowDataPacket): AppSettings {
  return {
    showMercadoPagoIntegration: Boolean(r.show_mp),
    transferDiscountPercent: normalizeTransferDiscountPercent(r.transfer_percent),
    colorOverrides: parseJSON<Record<string, string>>(r.color_overrides, {}),
    updatedAt: fromMySQL(r.updated_at),
  };
}

function rowToPaymentEvent(r: RowDataPacket): PaymentEvent {
  return {
    id: r.id,
    tipId: r.tip_id ?? null,
    eventType: r.event_type,
    payload: r.payload,
    createdAt: fromMySQL(r.created_at) ?? now(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Settings
// ═══════════════════════════════════════════════════════════════════════════

async function ensureSettings(): Promise<AppSettings> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM settings WHERE id = 1");
  if (rows.length > 0) return rowToSettings(rows[0]);

  const defaults = defaultSettings();
  await pool.query(
    "INSERT INTO settings (id, show_mp, transfer_percent, color_overrides, updated_at) VALUES (1, ?, ?, ?, ?)",
    [1, defaults.transferDiscountPercent, JSON.stringify(defaults.colorOverrides), toMySQL(defaults.updatedAt)]
  );
  return defaults;
}

export async function getAppSettings(): Promise<AppSettings> {
  return ensureSettings();
}

export async function setMercadoPagoIntegrationVisible(show: boolean) {
  const pool = getPool();
  await ensureSettings();
  await pool.query(
    "UPDATE settings SET show_mp = ?, updated_at = ? WHERE id = 1",
    [show ? 1 : 0, toMySQL(now())]
  );
  return getAppSettings();
}

export async function setTransferDiscountPercentValue(value: number) {
  const pool = getPool();
  await ensureSettings();
  await pool.query(
    "UPDATE settings SET transfer_percent = ?, updated_at = ? WHERE id = 1",
    [normalizeTransferDiscountPercent(value), toMySQL(now())]
  );
  return getAppSettings();
}

export async function setColorOverrides(overrides: Record<string, string>) {
  const pool = getPool();
  await ensureSettings();
  await pool.query(
    "UPDATE settings SET color_overrides = ?, updated_at = ? WHERE id = 1",
    [JSON.stringify(overrides), toMySQL(now())]
  );
  return getAppSettings();
}

// ═══════════════════════════════════════════════════════════════════════════
// Storage info (MySQL stub)
// ═══════════════════════════════════════════════════════════════════════════

export async function getStorageInfo(): Promise<StorageInfo> {
  return {
    dbPath: `mysql://${process.env.DB_HOST || "localhost"}/${process.env.DB_DATABASE}`,
    backupDir: "(MySQL — sin backup local)",
    exists: true,
    sizeBytes: 0,
    updatedAt: now(),
  };
}

export async function exportDbSnapshot() {
  const pool = getPool();
  const [[settingsRows], [userRows], [creatorRows], [qrRows], [tipRows], [eventRows], [notifRows]] =
    await Promise.all([
      pool.query<RowDataPacket[]>("SELECT * FROM settings WHERE id = 1"),
      pool.query<RowDataPacket[]>("SELECT * FROM users"),
      pool.query<RowDataPacket[]>("SELECT * FROM creators"),
      pool.query<RowDataPacket[]>("SELECT * FROM qr_codes"),
      pool.query<RowDataPacket[]>("SELECT * FROM tips"),
      pool.query<RowDataPacket[]>("SELECT * FROM payment_events"),
      pool.query<RowDataPacket[]>("SELECT * FROM notifications"),
    ]);

  return {
    app: "qrpropina",
    exportedAt: now(),
    storage: await getStorageInfo(),
    data: {
      schemaVersion: 10,
      settings: settingsRows.length > 0 ? rowToSettings(settingsRows[0]) : defaultSettings(),
      users: userRows.map(rowToUser),
      creators: creatorRows.map(rowToCreator),
      qrCodes: qrRows.map(rowToQrCode),
      tips: tipRows.map(rowToTip),
      paymentEvents: eventRows.map(rowToPaymentEvent),
      notifications: notifRows.map(rowToNotification),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Activity version (cache invalidation)
// ═══════════════════════════════════════════════════════════════════════════

export async function getActivityVersionForSession(input: {
  role: UserRole;
  creatorId?: string | null;
}) {
  const pool = getPool();
  const isCreator = input.role === "creator" && Boolean(input.creatorId);
  const notifTarget = isCreator ? input.creatorId! : ADMIN_NOTIFICATIONS_ID;

  const [settingsRow] = await pool.query<RowDataPacket[]>("SELECT updated_at FROM settings WHERE id = 1");
  const settingsTs = fromMySQL(settingsRow[0]?.updated_at) ?? "";

  let creatorsTs = "", creatorsCount = 0;
  let qrsTs = "", qrsCount = 0;
  let tipsTs = "", tipsCount = 0;
  let usersTs = "", usersCount = 0;
  let eventsTs = "", eventsCount = 0;

  if (isCreator) {
    const [[cr], [qr], [ti]] = await Promise.all([
      pool.query<RowDataPacket[]>("SELECT MAX(updated_at) ts, COUNT(*) cnt FROM creators WHERE id = ?", [input.creatorId]),
      pool.query<RowDataPacket[]>("SELECT MAX(updated_at) ts, COUNT(*) cnt FROM qr_codes WHERE creator_id = ?", [input.creatorId]),
      pool.query<RowDataPacket[]>("SELECT MAX(updated_at) ts, COUNT(*) cnt FROM tips WHERE creator_id = ?", [input.creatorId]),
    ]);
    creatorsTs = fromMySQL(cr[0]?.ts) ?? "";
    creatorsCount = Number(cr[0]?.cnt ?? 0);
    qrsTs = fromMySQL(qr[0]?.ts) ?? "";
    qrsCount = Number(qr[0]?.cnt ?? 0);
    tipsTs = fromMySQL(ti[0]?.ts) ?? "";
    tipsCount = Number(ti[0]?.cnt ?? 0);
  } else {
    const [[cr], [qr], [ti], [us], [ev]] = await Promise.all([
      pool.query<RowDataPacket[]>("SELECT MAX(updated_at) ts, COUNT(*) cnt FROM creators"),
      pool.query<RowDataPacket[]>("SELECT MAX(updated_at) ts, COUNT(*) cnt FROM qr_codes"),
      pool.query<RowDataPacket[]>("SELECT MAX(updated_at) ts, COUNT(*) cnt FROM tips"),
      pool.query<RowDataPacket[]>("SELECT MAX(updated_at) ts, COUNT(*) cnt FROM users"),
      pool.query<RowDataPacket[]>("SELECT MAX(created_at) ts, COUNT(*) cnt FROM payment_events"),
    ]);
    creatorsTs = fromMySQL(cr[0]?.ts) ?? "";
    creatorsCount = Number(cr[0]?.cnt ?? 0);
    qrsTs = fromMySQL(qr[0]?.ts) ?? "";
    qrsCount = Number(qr[0]?.cnt ?? 0);
    tipsTs = fromMySQL(ti[0]?.ts) ?? "";
    tipsCount = Number(ti[0]?.cnt ?? 0);
    usersTs = fromMySQL(us[0]?.ts) ?? "";
    usersCount = Number(us[0]?.cnt ?? 0);
    eventsTs = fromMySQL(ev[0]?.ts) ?? "";
    eventsCount = Number(ev[0]?.cnt ?? 0);
  }

  const [notifRows] = await pool.query<RowDataPacket[]>(
    "SELECT MAX(updated_at) ts, COUNT(*) cnt, SUM(is_visible = 1 AND is_read = 0) unread FROM notifications WHERE creator_id = ?",
    [notifTarget]
  );
  const notifTs = fromMySQL(notifRows[0]?.ts) ?? "";
  const notifCount = Number(notifRows[0]?.cnt ?? 0);
  const unread = Number(notifRows[0]?.unread ?? 0);

  const latest = [settingsTs, creatorsTs, qrsTs, tipsTs, notifTs, usersTs, eventsTs]
    .filter(Boolean).sort().at(-1) ?? "";

  return [
    latest,
    `creators:${creatorsCount}`,
    `qrs:${qrsCount}`,
    `tips:${tipsCount}`,
    `notifications:${notifCount}`,
    `unread:${unread}`,
    isCreator ? `creator:${input.creatorId}` : `users:${usersCount}:events:${eventsCount}`,
  ].join("|");
}

// ═══════════════════════════════════════════════════════════════════════════
// Creators
// ═══════════════════════════════════════════════════════════════════════════

export async function listCreatorsWithRecentTips(take = 5): Promise<CreatorWithTips[]> {
  const pool = getPool();
  const [creatorRows] = await pool.query<RowDataPacket[]>("SELECT * FROM creators ORDER BY created_at DESC");
  if (creatorRows.length === 0) return [];

  const ids = creatorRows.map((r) => r.id);
  const [[qrRows], [tipRows]] = await Promise.all([
    pool.query<RowDataPacket[]>("SELECT * FROM qr_codes WHERE creator_id IN (?) ORDER BY created_at DESC", [ids]),
    pool.query<RowDataPacket[]>("SELECT * FROM tips WHERE creator_id IN (?) ORDER BY created_at DESC", [ids]),
  ]);

  const qrCodes = (qrRows as RowDataPacket[]).map(rowToQrCode);
  const tips = (tipRows as RowDataPacket[]).map(rowToTip);

  return creatorRows.map((r) => {
    const creator = rowToCreator(r);
    return {
      ...creator,
      qrCodes: qrCodes.filter((q) => q.creatorId === creator.id),
      tips: tips.filter((t) => t.creatorId === creator.id).slice(0, take),
    };
  });
}

export async function aggregateTips() {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COALESCE(COUNT(*),0) cnt, COALESCE(SUM(amount_cents),0) amount, COALESCE(SUM(platform_fee_cents),0) fee FROM tips WHERE status = 'approved'"
  );
  return {
    count: Number(rows[0]?.cnt ?? 0),
    amountCents: Number(rows[0]?.amount ?? 0),
    platformFeeCents: Number(rows[0]?.fee ?? 0),
  };
}

export async function getCreatorBySlug(slug: string): Promise<Creator | null> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM creators WHERE slug = ?", [slug]);
  return rows.length > 0 ? rowToCreator(rows[0]) : null;
}

export async function getCreatorWithTips(id: string, take = 12): Promise<CreatorWithTips | null> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [id]);
  if (rows.length === 0) return null;

  const creator = rowToCreator(rows[0]);
  const [[qrRows], [tipRows]] = await Promise.all([
    pool.query<RowDataPacket[]>("SELECT * FROM qr_codes WHERE creator_id = ? ORDER BY created_at DESC", [id]),
    pool.query<RowDataPacket[]>("SELECT * FROM tips WHERE creator_id = ? ORDER BY created_at DESC LIMIT ?", [id, take]),
  ]);

  return {
    ...creator,
    qrCodes: (qrRows as RowDataPacket[]).map(rowToQrCode),
    tips: (tipRows as RowDataPacket[]).map(rowToTip),
  };
}

export async function setCreatorActive(id: string, isActive: boolean) {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [id]);
  if (rows.length === 0) throw new Error("Creador no encontrado.");
  await pool.query("UPDATE creators SET is_active = ?, updated_at = ? WHERE id = ?", [isActive ? 1 : 0, toMySQL(now()), id]);
  const [updated] = await pool.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [id]);
  return rowToCreator(updated[0]);
}

async function uniqueCreatorSlugConn(conn: PoolConnection, displayName: string): Promise<string> {
  const base = slugify(displayName);
  let slug = base;
  let index = 2;
  for (;;) {
    const [rows] = await conn.query<RowDataPacket[]>("SELECT id FROM creators WHERE slug = ?", [slug]);
    if (rows.length === 0) return slug;
    slug = `${base}-${index++}`;
  }
}

export async function createCreatorRecord(input: {
  displayName: string;
  slug: string;
  role?: string | null;
  locationName?: string | null;
  commissionPercent: number;
  ownerUserId?: string | null;
}) {
  const pool = getPool();
  const [existing] = await pool.query<RowDataPacket[]>("SELECT id FROM creators WHERE slug = ?", [input.slug]);
  if (existing.length > 0) throw new Error("Ese alias ya existe.");

  const timestamp = now();
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO creators
       (id, owner_user_id, display_name, slug, role, location_name, commission_percent, is_active, onboarding_completed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`,
    [id, input.ownerUserId ?? null, input.displayName, input.slug, input.role ?? null,
     input.locationName ?? null, input.commissionPercent, toMySQL(timestamp), toMySQL(timestamp)]
  );
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [id]);
  return rowToCreator(rows[0]);
}

export async function updateCreatorRecord(
  id: string,
  input: {
    displayName: string;
    slug: string;
    role?: string | null;
    locationName?: string | null;
    commissionPercent: number;
  }
) {
  const pool = getPool();
  const [exists] = await pool.query<RowDataPacket[]>("SELECT id FROM creators WHERE id = ?", [id]);
  if (exists.length === 0) throw new Error("Creador no encontrado.");

  const [slugConflict] = await pool.query<RowDataPacket[]>("SELECT id FROM creators WHERE slug = ? AND id != ?", [input.slug, id]);
  if (slugConflict.length > 0) throw new Error("Ese alias ya existe.");

  await pool.query(
    "UPDATE creators SET display_name=?, slug=?, role=?, location_name=?, commission_percent=?, updated_at=? WHERE id=?",
    [input.displayName, input.slug, input.role ?? null, input.locationName ?? null, input.commissionPercent, toMySQL(now()), id]
  );
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [id]);
  return rowToCreator(rows[0]);
}

export async function updateCreatorProfileRecord(
  id: string,
  input: { displayName: string; slug: string; role?: string | null; locationName?: string | null }
) {
  const pool = getPool();
  const [exists] = await pool.query<RowDataPacket[]>("SELECT id FROM creators WHERE id = ?", [id]);
  if (exists.length === 0) throw new Error("Creador no encontrado.");

  const [slugConflict] = await pool.query<RowDataPacket[]>("SELECT id FROM creators WHERE slug = ? AND id != ?", [input.slug, id]);
  if (slugConflict.length > 0) throw new Error("Ese alias ya existe.");

  await pool.query(
    "UPDATE creators SET display_name=?, slug=?, role=?, location_name=?, updated_at=? WHERE id=?",
    [input.displayName, input.slug, input.role ?? null, input.locationName ?? null, toMySQL(now()), id]
  );
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [id]);
  return rowToCreator(rows[0]);
}

export async function updateCreatorSocialsRecord(id: string, input: SocialLinks) {
  const pool = getPool();
  const [exists] = await pool.query<RowDataPacket[]>("SELECT id FROM creators WHERE id = ?", [id]);
  if (exists.length === 0) throw new Error("Creador no encontrado.");

  const socialLinks: SocialLinks = {
    instagram: input.instagram || null,
    tiktok: input.tiktok || null,
    x: input.x || null,
    facebook: input.facebook || null,
    youtube: input.youtube || null,
  };
  await pool.query("UPDATE creators SET social_links=?, updated_at=? WHERE id=?", [JSON.stringify(socialLinks), toMySQL(now()), id]);
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [id]);
  return rowToCreator(rows[0]);
}

export async function updateCreatorThankYouRecord(id: string, thankYouMessage: string | null) {
  const pool = getPool();
  const [exists] = await pool.query<RowDataPacket[]>("SELECT id FROM creators WHERE id = ?", [id]);
  if (exists.length === 0) throw new Error("Creador no encontrado.");
  await pool.query("UPDATE creators SET thank_you_message=?, updated_at=? WHERE id=?", [thankYouMessage || null, toMySQL(now()), id]);
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [id]);
  return rowToCreator(rows[0]);
}

export async function setCreatorOnboardingCompletedRecord(id: string) {
  const pool = getPool();
  const [exists] = await pool.query<RowDataPacket[]>("SELECT id FROM creators WHERE id = ?", [id]);
  if (exists.length === 0) throw new Error("Creador no encontrado.");
  await pool.query("UPDATE creators SET onboarding_completed=1, updated_at=? WHERE id=?", [toMySQL(now()), id]);
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [id]);
  return rowToCreator(rows[0]);
}

export async function deleteCreatorRecord(id: string) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [id]);
    if (rows.length === 0) throw new Error("Creador no encontrado.");
    const creator = rowToCreator(rows[0]);

    const [tipRows] = await conn.query<RowDataPacket[]>("SELECT id FROM tips WHERE creator_id = ?", [id]);
    const tipIds = (tipRows as RowDataPacket[]).map((r) => r.id);
    if (tipIds.length > 0) {
      await conn.query("DELETE FROM payment_events WHERE tip_id IN (?)", [tipIds]);
    }
    await conn.query("DELETE FROM tips WHERE creator_id = ?", [id]);
    await conn.query("DELETE FROM qr_codes WHERE creator_id = ?", [id]);
    await conn.query("DELETE FROM notifications WHERE creator_id = ?", [id]);
    await conn.query("DELETE FROM creators WHERE id = ?", [id]);
    await conn.query("UPDATE users SET creator_id = NULL, updated_at = ? WHERE creator_id = ?", [toMySQL(now()), id]);
    await conn.commit();
    return creator;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Mercado Pago alias
// ═══════════════════════════════════════════════════════════════════════════

export async function checkMercadoPagoAlias(input: string, exceptCreatorId?: string | null) {
  try {
    const alias = validateMercadoPagoAlias(input);
    const pool = getPool();
    const query = exceptCreatorId
      ? "SELECT id FROM creators WHERE mp_alias = ? AND id != ?"
      : "SELECT id FROM creators WHERE mp_alias = ?";
    const params = exceptCreatorId ? [alias, exceptCreatorId] : [alias];
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    const exists = rows.length > 0;
    return {
      alias, exists, available: !exists, valid: true,
      message: exists ? "Ese alias ya esta cargado en qrpropina." : "Alias disponible en qrpropina.",
    };
  } catch (error) {
    return {
      alias: normalizeMercadoPagoAlias(input),
      exists: false, available: false, valid: false,
      message: error instanceof Error ? error.message : "Alias inválido.",
    };
  }
}

export async function updateCreatorMercadoPagoAliasRecord(id: string, aliasInput: string) {
  const pool = getPool();
  const alias = validateMercadoPagoAlias(aliasInput);
  const [conflict] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM creators WHERE mp_alias = ? AND id != ?", [alias, id]
  );
  if (conflict.length > 0) throw new Error("Ese alias ya esta cargado en qrpropina.");

  const [exists] = await pool.query<RowDataPacket[]>("SELECT id FROM creators WHERE id = ?", [id]);
  if (exists.length === 0) throw new Error("Creador no encontrado.");

  await pool.query("UPDATE creators SET mp_alias=?, updated_at=? WHERE id=?", [alias, toMySQL(now()), id]);
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [id]);
  return rowToCreator(rows[0]);
}

export async function connectCreatorMercadoPago(
  id: string,
  input: {
    userId: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: Date | null;
    account?: {
      nickname?: string | null;
      email?: string | null;
      siteId?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      countryId?: string | null;
      permalink?: string | null;
    } | null;
  }
) {
  const pool = getPool();
  const [exists] = await pool.query<RowDataPacket[]>("SELECT id, mp_alias FROM creators WHERE id = ?", [id]);
  if (exists.length === 0) throw new Error("Creador no encontrado.");

  let mpAlias: string | null = exists[0].mp_alias ?? null;
  if (input.account?.nickname) {
    try {
      const detectedAlias = validateMercadoPagoAlias(input.account.nickname);
      const [conflict] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM creators WHERE mp_alias = ? AND id != ?", [detectedAlias, id]
      );
      if (conflict.length === 0) mpAlias = detectedAlias;
    } catch { /* nickname may not match our alias format */ }
  }

  const timestamp = toMySQL(now());
  await pool.query(
    `UPDATE creators SET
       mp_user_id=?, mp_nickname=?, mp_email=?, mp_site_id=?, mp_first_name=?, mp_last_name=?,
       mp_country_id=?, mp_permalink=?, mp_access_token=?, mp_refresh_token=?, mp_token_expires_at=?,
       mp_alias=?, updated_at=? WHERE id=?`,
    [
      input.userId, input.account?.nickname ?? null, input.account?.email ?? null,
      input.account?.siteId ?? null, input.account?.firstName ?? null, input.account?.lastName ?? null,
      input.account?.countryId ?? null, input.account?.permalink ?? null,
      input.accessToken, input.refreshToken,
      input.expiresAt ? toMySQL(input.expiresAt.toISOString()) : null,
      mpAlias, timestamp, id,
    ]
  );
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [id]);
  return rowToCreator(rows[0]);
}

export async function updateCreatorMpTokensRecord(
  id: string,
  input: { accessToken: string | null; refreshToken: string | null; expiresAt: Date | null }
) {
  const pool = getPool();
  await pool.query(
    "UPDATE creators SET mp_access_token=?, mp_refresh_token=?, mp_token_expires_at=?, updated_at=? WHERE id=?",
    [
      input.accessToken,
      input.refreshToken,
      input.expiresAt ? toMySQL(input.expiresAt.toISOString()) : null,
      toMySQL(now()),
      id,
    ]
  );
}

export async function disconnectCreatorMercadoPagoRecord(id: string) {
  const pool = getPool();
  const [exists] = await pool.query<RowDataPacket[]>("SELECT id FROM creators WHERE id = ?", [id]);
  if (exists.length === 0) throw new Error("Creador no encontrado.");

  await pool.query(
    `UPDATE creators SET
       mp_user_id=NULL, mp_nickname=NULL, mp_email=NULL, mp_site_id=NULL,
       mp_first_name=NULL, mp_last_name=NULL, mp_country_id=NULL, mp_permalink=NULL,
       mp_access_token=NULL, mp_refresh_token=NULL, mp_token_expires_at=NULL, updated_at=? WHERE id=?`,
    [toMySQL(now()), id]
  );
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [id]);
  return rowToCreator(rows[0]);
}

// ═══════════════════════════════════════════════════════════════════════════
// QR Codes
// ═══════════════════════════════════════════════════════════════════════════

export async function checkQrIdAvailability(input: string, exceptRecordId?: string | null) {
  try {
    const qrId = validateQrId(input);
    const pool = getPool();
    const query = exceptRecordId
      ? "SELECT id FROM qr_codes WHERE qr_id = ? AND id != ?"
      : "SELECT id FROM qr_codes WHERE qr_id = ?";
    const params = exceptRecordId ? [qrId, exceptRecordId] : [qrId];
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    const exists = rows.length > 0;
    return { qrId, exists, available: !exists, valid: true, message: exists ? "QR existente." : "ID disponible." };
  } catch (error) {
    return {
      qrId: normalizeQrId(input), exists: false, available: false, valid: false,
      message: error instanceof Error ? error.message : "ID inválido.",
    };
  }
}

function timestampQrId(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    pad(d.getFullYear() % 100) +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

async function resolveUniqueQrId(pool: Pool, candidate: string): Promise<string> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT id FROM qr_codes WHERE qr_id = ?", [candidate]);
  if (rows.length === 0) return candidate;
  const suffix = String(Math.floor(Math.random() * 900) + 100);
  return candidate + suffix;
}

export async function createAdminQrRecord(input: { qrId?: string; isAutoInstallable: boolean; isBulkPrint?: boolean }): Promise<CreatorQrCode> {
  const pool = getPool();
  const base = input.qrId ? validateQrId(input.qrId) : timestampQrId();
  const qrId = await resolveUniqueQrId(pool, base);

  const timestamp = now();
  const id = crypto.randomUUID();
  await pool.query(
    "INSERT INTO qr_codes (id, creator_id, qr_id, is_auto_installable, is_bulk_print, created_at, updated_at) VALUES (?, NULL, ?, ?, ?, ?, ?)",
    [id, qrId, input.isAutoInstallable ? 1 : 0, input.isBulkPrint ? 1 : 0, toMySQL(timestamp), toMySQL(timestamp)]
  );
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM qr_codes WHERE id = ?", [id]);
  return rowToQrCode(rows[0]);
}

export async function listAdminQrCodes(
  page = 1,
  pageSize = 20
): Promise<{ items: CreatorQrCode[]; total: number; totalPages: number }> {
  const pool = getPool();
  const [[countRows], [rows]] = await Promise.all([
    pool.query<RowDataPacket[]>("SELECT COUNT(*) cnt FROM qr_codes WHERE creator_id IS NULL"),
    pool.query<RowDataPacket[]>(
      "SELECT * FROM qr_codes WHERE creator_id IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [pageSize, (page - 1) * pageSize]
    ),
  ]);
  const total = Number(countRows[0]?.cnt ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { items: (rows as RowDataPacket[]).map(rowToQrCode), total, totalPages };
}

export async function deleteAdminQrCodeRecord(recordId: string): Promise<void> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM qr_codes WHERE id = ? AND creator_id IS NULL", [recordId]
  );
  if (rows.length === 0) throw new Error("QR no encontrado.");
  await pool.query("DELETE FROM qr_codes WHERE id = ?", [recordId]);
}

export async function createQrCodeRecord(input: { creatorId: string; qrId?: string }) {
  const pool = getPool();
  const [creatorExists] = await pool.query<RowDataPacket[]>("SELECT id FROM creators WHERE id = ?", [input.creatorId]);
  if (creatorExists.length === 0) throw new Error("Creador no encontrado.");

  const [countRows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) cnt FROM qr_codes WHERE creator_id = ?", [input.creatorId]);
  if (Number(countRows[0].cnt) >= 3) throw new Error("Cada creador puede tener como máximo 3 QR.");

  const base = input.qrId ? validateQrId(input.qrId) : timestampQrId();
  const qrId = await resolveUniqueQrId(pool, base);

  const timestamp = now();
  const id = crypto.randomUUID();
  await pool.query(
    "INSERT INTO qr_codes (id, creator_id, qr_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    [id, input.creatorId, qrId, toMySQL(timestamp), toMySQL(timestamp)]
  );
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM qr_codes WHERE id = ?", [id]);
  return rowToQrCode(rows[0]);
}

export async function updateQrCodeRecord(input: { creatorId: string; recordId: string; qrId: string }) {
  const pool = getPool();
  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM qr_codes WHERE id = ? AND creator_id = ?", [input.recordId, input.creatorId]
  );
  if (existing.length === 0) throw new Error("QR no encontrado.");

  const qrId = validateQrId(input.qrId);
  const [conflict] = await pool.query<RowDataPacket[]>("SELECT id FROM qr_codes WHERE qr_id = ? AND id != ?", [qrId, input.recordId]);
  if (conflict.length > 0) throw new Error("Ese ID ya existe.");

  await pool.query("UPDATE qr_codes SET qr_id=?, updated_at=? WHERE id=?", [qrId, toMySQL(now()), input.recordId]);
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM qr_codes WHERE id = ?", [input.recordId]);
  return rowToQrCode(rows[0]);
}

export async function deleteQrCodeRecord(input: { creatorId: string; recordId: string }) {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM qr_codes WHERE id = ? AND creator_id = ?", [input.recordId, input.creatorId]
  );
  if (rows.length === 0) throw new Error("QR no encontrado.");
  await pool.query("DELETE FROM qr_codes WHERE id = ?", [input.recordId]);
  return rowToQrCode(rows[0]);
}

export async function getQrCodeWithCreatorByQrId(qrIdInput: string): Promise<QrCodeWithCreator | null> {
  const qrId = normalizeQrId(qrIdInput);
  const pool = getPool();
  const [qrRows] = await pool.query<RowDataPacket[]>("SELECT * FROM qr_codes WHERE qr_id = ?", [qrId]);
  if (qrRows.length === 0) return null;

  const qrCode = rowToQrCode(qrRows[0]);
  const [creatorRows] = await pool.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [qrCode.creatorId]);
  if (creatorRows.length === 0) return null;

  return { ...qrCode, creator: rowToCreator(creatorRows[0]) };
}

export async function getQrCodeByQrId(qrIdInput: string): Promise<CreatorQrCode | null> {
  const qrId = normalizeQrId(qrIdInput);
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM qr_codes WHERE qr_id = ?", [qrId]);
  if (rows.length === 0) return null;
  return rowToQrCode(rows[0]);
}

export async function assignQrToCreator(qrIdInput: string, creatorId: string): Promise<void> {
  const qrId = normalizeQrId(qrIdInput);
  const pool = getPool();
  await pool.query(
    "UPDATE qr_codes SET creator_id = ?, updated_at = ? WHERE qr_id = ? AND creator_id IS NULL",
    [creatorId, toMySQL(now()), qrId]
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Users
// ═══════════════════════════════════════════════════════════════════════════

export async function upsertGoogleUser(input: {
  email: string;
  name?: string | null;
  picture?: string | null;
}) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const timestamp = now();
    const mysqlTs = toMySQL(timestamp)!;
    const email = normalizedEmail(input.email);
    const role: UserRole = emailIsAdmin(email) ? "admin" : "creator";

    const [existingUsers] = await conn.query<RowDataPacket[]>("SELECT * FROM users WHERE email = ?", [email]);
    let user: User;
    let isNewUser = false;

    if (existingUsers.length === 0) {
      isNewUser = true;
      const uid = crypto.randomUUID();
      await conn.query(
        "INSERT INTO users (id, email, name, picture, role, creator_id, created_at, updated_at, last_login_at) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)",
        [uid, email, input.name ?? null, input.picture ?? null, role, mysqlTs, mysqlTs, mysqlTs]
      );
      const [newRows] = await conn.query<RowDataPacket[]>("SELECT * FROM users WHERE id = ?", [uid]);
      user = rowToUser(newRows[0]);
    } else {
      user = rowToUser(existingUsers[0]);
      user.name = input.name || user.name || null;
      user.picture = input.picture || user.picture || null;
      user.role = role;
      await conn.query(
        "UPDATE users SET name=?, picture=?, role=?, updated_at=?, last_login_at=? WHERE id=?",
        [user.name, user.picture, role, mysqlTs, mysqlTs, user.id]
      );
    }

    if (role === "creator") {
      let creator: Creator | null = null;
      if (user.creatorId) {
        const [cr] = await conn.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [user.creatorId]);
        if (cr.length > 0) creator = rowToCreator(cr[0]);
      }

      if (!creator) {
        const displayName = input.name || email.split("@")[0];
        const slug = await uniqueCreatorSlugConn(conn, displayName);
        const cid = crypto.randomUUID();
        await conn.query(
          `INSERT INTO creators
             (id, owner_user_id, display_name, slug, role, location_name, photo_url, commission_percent, is_active, onboarding_completed, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'Creador', NULL, ?, 5, 1, 0, ?, ?)`,
          [cid, user.id, displayName, slug, input.picture ?? null, mysqlTs, mysqlTs]
        );
        const [cr] = await conn.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [cid]);
        creator = rowToCreator(cr[0]);

        // Auto-crear primer QR usando el prefijo del email (sin @dominio)
        const emailPrefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "user";
        const [existingQrRows] = await conn.query<RowDataPacket[]>("SELECT id FROM qr_codes WHERE qr_id = ?", [emailPrefix]);
        const autoQrId = existingQrRows.length === 0
          ? emailPrefix
          : emailPrefix + "-" + String(Math.floor(Math.random() * 900) + 100);
        const qrRecordId = crypto.randomUUID();
        await conn.query(
          "INSERT INTO qr_codes (id, creator_id, qr_id, is_auto_installable, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)",
          [qrRecordId, creator.id, autoQrId, mysqlTs, mysqlTs]
        );
      } else {
        await conn.query(
          "UPDATE creators SET owner_user_id=?, photo_url=COALESCE(?, photo_url), updated_at=? WHERE id=?",
          [user.id, input.picture ?? null, mysqlTs, creator.id]
        );
        const [cr] = await conn.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [creator.id]);
        creator = rowToCreator(cr[0]);
      }

      await conn.query("UPDATE users SET creator_id=? WHERE id=?", [creator.id, user.id]);
      user.creatorId = creator.id;
    } else {
      await conn.query("UPDATE users SET creator_id=NULL WHERE id=?", [user.id]);
      user.creatorId = null;
    }

    await conn.commit();
    return { user, isNewUser };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Tips
// ═══════════════════════════════════════════════════════════════════════════

export async function createTipRecord(input: {
  creatorId: string;
  amountCents: number;
  platformFeeCents: number;
  payerEmail?: string | null;
  externalReference: string;
}) {
  const pool = getPool();
  const timestamp = now();
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO tips (id, creator_id, amount_cents, platform_fee_cents, currency, status, external_reference, payer_email, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'ARS', 'created', ?, ?, ?, ?)`,
    [id, input.creatorId, input.amountCents, input.platformFeeCents,
     input.externalReference, input.payerEmail ?? null, toMySQL(timestamp), toMySQL(timestamp)]
  );
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM tips WHERE id = ?", [id]);
  return rowToTip(rows[0]);
}

export async function updateTipRecord(id: string, data: Partial<Omit<Tip, "id" | "createdAt">>) {
  const pool = getPool();
  const [existing] = await pool.query<RowDataPacket[]>("SELECT id FROM tips WHERE id = ?", [id]);
  if (existing.length === 0) throw new Error("Propina no encontrada.");

  const fields: string[] = [];
  const values: unknown[] = [];

  const colMap: Record<string, string> = {
    creatorId: "creator_id", amountCents: "amount_cents", platformFeeCents: "platform_fee_cents",
    currency: "currency", status: "status", preferenceId: "preference_id", paymentId: "payment_id",
    externalReference: "external_reference", checkoutUrl: "checkout_url",
    payerEmail: "payer_email", rawPayment: "raw_payment", updatedAt: "updated_at",
  };

  for (const [key, val] of Object.entries(data)) {
    const col = colMap[key];
    if (!col || col === "updated_at") continue;
    fields.push(`${col} = ?`);
    values.push(val);
  }
  fields.push("updated_at = ?");
  values.push(toMySQL(now()));
  values.push(id);

  await pool.query(`UPDATE tips SET ${fields.join(", ")} WHERE id = ?`, values);
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM tips WHERE id = ?", [id]);
  return rowToTip(rows[0]);
}

export async function getTipWithCreator(id: string): Promise<TipWithCreator | null> {
  const pool = getPool();
  const [tipRows] = await pool.query<RowDataPacket[]>("SELECT * FROM tips WHERE id = ?", [id]);
  if (tipRows.length === 0) return null;

  const tip = rowToTip(tipRows[0]);
  const [creatorRows] = await pool.query<RowDataPacket[]>("SELECT * FROM creators WHERE id = ?", [tip.creatorId]);
  if (creatorRows.length === 0) return null;

  return { ...tip, creator: rowToCreator(creatorRows[0]) };
}

export async function updateTipFromPayment(input: {
  tipId?: string | null;
  externalReference?: string | null;
  paymentId?: string | null;
  status: string;
  rawPayment: string;
}) {
  const pool = getPool();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (input.tipId)            { conditions.push("id = ?");                   params.push(input.tipId); }
  if (input.externalReference){ conditions.push("external_reference = ?");   params.push(input.externalReference); }
  if (input.paymentId)        { conditions.push("payment_id = ?");           params.push(input.paymentId); }

  if (conditions.length === 0) return null;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM tips WHERE ${conditions.join(" OR ")} LIMIT 1`, params
  );
  if (rows.length === 0) return null;

  const tip = rowToTip(rows[0]);
  await pool.query(
    "UPDATE tips SET payment_id=COALESCE(?, payment_id), status=?, raw_payment=?, updated_at=? WHERE id=?",
    [input.paymentId ?? null, input.status, input.rawPayment, toMySQL(now()), tip.id]
  );
  const [updated] = await pool.query<RowDataPacket[]>("SELECT * FROM tips WHERE id = ?", [tip.id]);
  return rowToTip(updated[0]);
}

export async function listApprovedTipsWithCreators(
  page = 1,
  pageSize = 30
): Promise<{ items: TipWithCreator[]; total: number; totalPages: number }> {
  const pool = getPool();
  const [[countRows], [rows]] = await Promise.all([
    pool.query<RowDataPacket[]>("SELECT COUNT(*) cnt FROM tips WHERE status = 'approved'"),
    pool.query<RowDataPacket[]>(
      "SELECT * FROM tips WHERE status = 'approved' ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [pageSize, (page - 1) * pageSize]
    ),
  ]);
  const total = Number(countRows[0]?.cnt ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const tips = (rows as RowDataPacket[]).map(rowToTip);
  if (tips.length === 0) return { items: [], total, totalPages };

  const ids = [...new Set(tips.map((t) => t.creatorId))];
  const [creatorRows] = await pool.query<RowDataPacket[]>("SELECT * FROM creators WHERE id IN (?)", [ids]);
  const creatorsById = Object.fromEntries((creatorRows as RowDataPacket[]).map((r) => [r.id, rowToCreator(r)]));

  const items = tips
    .map((tip) => creatorsById[tip.creatorId] ? { ...tip, creator: creatorsById[tip.creatorId] } : null)
    .filter((t): t is TipWithCreator => t !== null);

  return { items, total, totalPages };
}

export async function listApprovedTipsForCreator(
  creatorId: string,
  page = 1,
  pageSize = 30
): Promise<{ items: Tip[]; total: number; totalPages: number }> {
  const pool = getPool();
  const [[countRows], [rows]] = await Promise.all([
    pool.query<RowDataPacket[]>("SELECT COUNT(*) cnt FROM tips WHERE creator_id = ? AND status = 'approved'", [creatorId]),
    pool.query<RowDataPacket[]>(
      "SELECT * FROM tips WHERE creator_id = ? AND status = 'approved' ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [creatorId, pageSize, (page - 1) * pageSize]
    ),
  ]);
  const total = Number(countRows[0]?.cnt ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { items: (rows as RowDataPacket[]).map(rowToTip), total, totalPages };
}

// ═══════════════════════════════════════════════════════════════════════════
// Payment events
// ═══════════════════════════════════════════════════════════════════════════

export async function addPaymentEvent(input: {
  tipId?: string | null;
  eventType: string;
  payload: string;
}) {
  const pool = getPool();
  const id = crypto.randomUUID();
  await pool.query(
    "INSERT INTO payment_events (id, tip_id, event_type, payload, created_at) VALUES (?, ?, ?, ?, ?)",
    [id, input.tipId ?? null, input.eventType, input.payload, toMySQL(now())]
  );
}

export async function listPaymentEvents(limit = 200): Promise<PaymentEvent[]> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM payment_events ORDER BY created_at DESC LIMIT ?", [limit]
  );
  return (rows as RowDataPacket[]).map(rowToPaymentEvent);
}

// ═══════════════════════════════════════════════════════════════════════════
// Notifications
// ═══════════════════════════════════════════════════════════════════════════

export async function listNotificationsForCreator(
  creatorId: string,
  page = 1,
  pageSize = 30
): Promise<{ items: Notification[]; total: number; totalPages: number }> {
  const pool = getPool();
  const [[countRows], [rows]] = await Promise.all([
    pool.query<RowDataPacket[]>("SELECT COUNT(*) cnt FROM notifications WHERE creator_id = ? AND is_visible = 1", [creatorId]),
    pool.query<RowDataPacket[]>(
      "SELECT * FROM notifications WHERE creator_id = ? AND is_visible = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [creatorId, pageSize, (page - 1) * pageSize]
    ),
  ]);
  const total = Number(countRows[0]?.cnt ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { items: (rows as RowDataPacket[]).map(rowToNotification), total, totalPages };
}

export async function countUnreadNotificationsForCreator(creatorId: string): Promise<number> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) cnt FROM notifications WHERE creator_id = ? AND is_visible = 1 AND is_read = 0", [creatorId]
  );
  return Number(rows[0]?.cnt ?? 0);
}

export async function softDeleteNotificationRecord(id: string, creatorId: string) {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM notifications WHERE id = ? AND creator_id = ?", [id, creatorId]);
  if (rows.length === 0) throw new Error("Notificación no encontrada.");
  await pool.query("UPDATE notifications SET is_visible = 0, updated_at = ? WHERE id = ?", [toMySQL(now()), id]);
  const [updated] = await pool.query<RowDataPacket[]>("SELECT * FROM notifications WHERE id = ?", [id]);
  return rowToNotification(updated[0]);
}

export async function markNotificationsReadForCreator(creatorId: string) {
  const pool = getPool();
  const [result] = await pool.query(
    "UPDATE notifications SET is_read = 1, updated_at = ? WHERE creator_id = ? AND is_visible = 1 AND is_read = 0",
    [toMySQL(now()), creatorId]
  );
  return (result as { affectedRows: number }).affectedRows;
}

export async function createNotificationRecord(input: {
  creatorId: string;
  title: string;
  body?: string | null;
  photoUrl?: string | null;
  imageUrl?: string | null;
}) {
  const pool = getPool();
  const timestamp = now();
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO notifications (id, creator_id, title, body, photo_url, image_url, is_read, is_visible, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?, ?)`,
    [id, input.creatorId, input.title, input.body ?? null, input.photoUrl ?? null, input.imageUrl ?? null,
     toMySQL(timestamp), toMySQL(timestamp)]
  );
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM notifications WHERE id = ?", [id]);
  return rowToNotification(rows[0]);
}
