// node --env-file=.env scripts/import-data.mjs
import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function unescapeEnv(value) {
  return value?.replace(/\\(.)/g, "$1");
}

function toMySQL(iso) {
  if (!iso) return null;
  return new Date(iso).toISOString().slice(0, 19).replace("T", " ");
}

const config = {
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT || "3306", 10),
  database: process.env.DB_DATABASE,
  user:     process.env.DB_USERNAME,
  password: unescapeEnv(process.env.DB_PASSWORD),
  connectTimeout: 10000,
};

console.log(`\nConectando a ${config.host}:${config.port} / ${config.database}…\n`);

const dbJson = JSON.parse(readFileSync(join(__dirname, "../data/db.json"), "utf8"));

let conn;
try {
  conn = await mysql.createConnection(config);

  // ─── settings ─────────────────────────────────────────────────────────
  const s = dbJson.settings ?? {};
  await conn.query(
    `INSERT INTO settings (id, show_mp, transfer_percent, color_overrides, updated_at)
     VALUES (1, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE show_mp=VALUES(show_mp), transfer_percent=VALUES(transfer_percent),
       color_overrides=VALUES(color_overrides), updated_at=VALUES(updated_at)`,
    [
      s.showMercadoPagoIntegration !== false ? 1 : 0,
      s.transferDiscountPercent ?? 5,
      JSON.stringify(s.colorOverrides ?? {}),
      toMySQL(s.updatedAt),
    ]
  );
  console.log("✓ settings");

  // ─── users ────────────────────────────────────────────────────────────
  for (const u of dbJson.users ?? []) {
    await conn.query(
      `INSERT INTO users (id, email, name, picture, role, creator_id, created_at, updated_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), picture=VALUES(picture), role=VALUES(role),
         creator_id=VALUES(creator_id), updated_at=VALUES(updated_at), last_login_at=VALUES(last_login_at)`,
      [u.id, u.email, u.name ?? null, u.picture ?? null, u.role ?? "creator",
       u.creatorId ?? null, toMySQL(u.createdAt), toMySQL(u.updatedAt), toMySQL(u.lastLoginAt)]
    );
  }
  console.log(`✓ users (${dbJson.users?.length ?? 0})`);

  // ─── creators ─────────────────────────────────────────────────────────
  for (const c of dbJson.creators ?? []) {
    await conn.query(
      `INSERT INTO creators
         (id, owner_user_id, display_name, slug, role, location_name, photo_url, mp_alias,
          commission_percent, mp_user_id, mp_nickname, mp_email, mp_site_id, mp_first_name,
          mp_last_name, mp_country_id, mp_permalink, mp_access_token, mp_refresh_token,
          mp_token_expires_at, social_links, thank_you_message, is_active, onboarding_completed,
          created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         display_name=VALUES(display_name), slug=VALUES(slug), role=VALUES(role),
         location_name=VALUES(location_name), photo_url=VALUES(photo_url), mp_alias=VALUES(mp_alias),
         commission_percent=VALUES(commission_percent), mp_user_id=VALUES(mp_user_id),
         mp_nickname=VALUES(mp_nickname), mp_email=VALUES(mp_email), mp_site_id=VALUES(mp_site_id),
         mp_first_name=VALUES(mp_first_name), mp_last_name=VALUES(mp_last_name),
         mp_country_id=VALUES(mp_country_id), mp_permalink=VALUES(mp_permalink),
         mp_access_token=VALUES(mp_access_token), mp_refresh_token=VALUES(mp_refresh_token),
         mp_token_expires_at=VALUES(mp_token_expires_at), social_links=VALUES(social_links),
         thank_you_message=VALUES(thank_you_message), is_active=VALUES(is_active),
         onboarding_completed=VALUES(onboarding_completed), updated_at=VALUES(updated_at)`,
      [
        c.id, c.ownerUserId ?? null, c.displayName, c.slug, c.role ?? null,
        c.locationName ?? null, c.photoUrl ?? null, c.mpAlias ?? null,
        c.commissionPercent ?? 5,
        c.mpUserId ?? null, c.mpNickname ?? null, c.mpEmail ?? null, c.mpSiteId ?? null,
        c.mpFirstName ?? null, c.mpLastName ?? null, c.mpCountryId ?? null, c.mpPermalink ?? null,
        c.mpAccessToken ?? null, c.mpRefreshToken ?? null,
        toMySQL(c.mpTokenExpiresAt),
        c.socialLinks ? JSON.stringify(c.socialLinks) : null,
        c.thankYouMessage ?? null,
        c.isActive !== false ? 1 : 0,
        c.onboardingCompleted ? 1 : 0,
        toMySQL(c.createdAt), toMySQL(c.updatedAt),
      ]
    );
  }
  console.log(`✓ creators (${dbJson.creators?.length ?? 0})`);

  // ─── qr_codes ─────────────────────────────────────────────────────────
  for (const q of dbJson.qrCodes ?? []) {
    await conn.query(
      `INSERT INTO qr_codes (id, creator_id, qr_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE qr_id=VALUES(qr_id), updated_at=VALUES(updated_at)`,
      [q.id, q.creatorId, q.qrId, toMySQL(q.createdAt), toMySQL(q.updatedAt)]
    );
  }
  console.log(`✓ qr_codes (${dbJson.qrCodes?.length ?? 0})`);

  // ─── tips ─────────────────────────────────────────────────────────────
  for (const t of dbJson.tips ?? []) {
    const creatorId = t.creatorId || t.recipientId || null;
    await conn.query(
      `INSERT INTO tips
         (id, creator_id, amount_cents, platform_fee_cents, currency, status,
          preference_id, payment_id, external_reference, checkout_url, payer_email, raw_payment,
          created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE status=VALUES(status), payment_id=VALUES(payment_id),
         raw_payment=VALUES(raw_payment), updated_at=VALUES(updated_at)`,
      [
        t.id, creatorId, t.amountCents, t.platformFeeCents ?? 0,
        t.currency ?? "ARS", t.status ?? "created",
        t.preferenceId ?? null, t.paymentId ?? null,
        t.externalReference ?? t.id,
        t.checkoutUrl ?? null, t.payerEmail ?? null, t.rawPayment ?? null,
        toMySQL(t.createdAt), toMySQL(t.updatedAt),
      ]
    );
  }
  console.log(`✓ tips (${dbJson.tips?.length ?? 0})`);

  // ─── payment_events ───────────────────────────────────────────────────
  for (const e of dbJson.paymentEvents ?? []) {
    await conn.query(
      `INSERT IGNORE INTO payment_events (id, tip_id, event_type, payload, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [e.id, e.tipId ?? null, e.eventType, e.payload, toMySQL(e.createdAt)]
    );
  }
  console.log(`✓ payment_events (${dbJson.paymentEvents?.length ?? 0})`);

  // ─── notifications ────────────────────────────────────────────────────
  for (const n of dbJson.notifications ?? []) {
    await conn.query(
      `INSERT INTO notifications
         (id, creator_id, title, body, photo_url, image_url, is_read, is_visible, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE title=VALUES(title), body=VALUES(body),
         is_read=VALUES(is_read), is_visible=VALUES(is_visible), updated_at=VALUES(updated_at)`,
      [
        n.id, n.creatorId, n.title, n.body ?? null,
        n.photoUrl ?? null, n.imageUrl ?? null,
        n.isRead ? 1 : 0, n.isVisible !== false ? 1 : 0,
        toMySQL(n.createdAt), toMySQL(n.updatedAt),
      ]
    );
  }
  console.log(`✓ notifications (${dbJson.notifications?.length ?? 0})`);

  console.log("\n✅ Importación completada.\n");
} catch (err) {
  console.error(`\n❌ Error: ${err.message}\n`);
  process.exit(1);
} finally {
  if (conn) await conn.end().catch(() => {});
}
