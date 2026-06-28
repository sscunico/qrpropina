-- QRPropina – Schema MySQL
-- Correr con: node --env-file=.env scripts/migrate.mjs

CREATE TABLE IF NOT EXISTS settings (
  id               INT PRIMARY KEY DEFAULT 1,
  show_mp          TINYINT(1)     NOT NULL DEFAULT 1,
  transfer_percent DECIMAL(5,2)   NOT NULL DEFAULT 5.00,
  color_overrides  JSON           NOT NULL,
  updated_at       DATETIME       NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)      PRIMARY KEY,
  email         VARCHAR(255)  NOT NULL,
  name          VARCHAR(255)  NULL,
  picture       TEXT          NULL,
  role          ENUM('admin','creator') NOT NULL DEFAULT 'creator',
  creator_id    CHAR(36)      NULL,
  created_at    DATETIME      NOT NULL,
  updated_at    DATETIME      NOT NULL,
  last_login_at DATETIME      NULL,
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_creator_id (creator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS creators (
  id                    CHAR(36)      PRIMARY KEY,
  owner_user_id         CHAR(36)      NULL,
  display_name          VARCHAR(255)  NOT NULL,
  slug                  VARCHAR(42)   NOT NULL,
  role                  VARCHAR(100)  NULL,
  location_name         VARCHAR(255)  NULL,
  photo_url             TEXT          NULL,
  mp_alias              VARCHAR(100)  NULL,
  commission_percent    DECIMAL(5,2)  NOT NULL DEFAULT 5.00,
  mp_user_id            VARCHAR(100)  NULL,
  mp_nickname           VARCHAR(255)  NULL,
  mp_email              VARCHAR(255)  NULL,
  mp_site_id            VARCHAR(10)   NULL,
  mp_first_name         VARCHAR(255)  NULL,
  mp_last_name          VARCHAR(255)  NULL,
  mp_country_id         VARCHAR(10)   NULL,
  mp_permalink          TEXT          NULL,
  mp_access_token       TEXT          NULL,
  mp_refresh_token      TEXT          NULL,
  mp_token_expires_at   DATETIME      NULL,
  social_links          JSON          NULL,
  thank_you_message     TEXT          NULL,
  is_active             TINYINT(1)    NOT NULL DEFAULT 1,
  onboarding_completed  TINYINT(1)    NOT NULL DEFAULT 0,
  created_at            DATETIME      NOT NULL,
  updated_at            DATETIME      NOT NULL,
  UNIQUE KEY uq_creators_slug (slug),
  INDEX idx_creators_owner_user_id (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS qr_codes (
  id         CHAR(36)   PRIMARY KEY,
  creator_id CHAR(36)   NOT NULL,
  qr_id      VARCHAR(64) NOT NULL,
  created_at DATETIME   NOT NULL,
  updated_at DATETIME   NOT NULL,
  UNIQUE KEY uq_qr_codes_qr_id (qr_id),
  INDEX idx_qr_codes_creator_id (creator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tips (
  id                 CHAR(36)      PRIMARY KEY,
  creator_id         CHAR(36)      NOT NULL,
  amount_cents       INT           NOT NULL,
  platform_fee_cents INT           NOT NULL,
  currency           VARCHAR(10)   NOT NULL DEFAULT 'ARS',
  status             VARCHAR(50)   NOT NULL DEFAULT 'created',
  preference_id      VARCHAR(255)  NULL,
  payment_id         VARCHAR(255)  NULL,
  external_reference VARCHAR(255)  NOT NULL,
  checkout_url       TEXT          NULL,
  payer_email        VARCHAR(255)  NULL,
  raw_payment        LONGTEXT      NULL,
  created_at         DATETIME      NOT NULL,
  updated_at         DATETIME      NOT NULL,
  INDEX idx_tips_creator_id (creator_id),
  INDEX idx_tips_external_reference (external_reference),
  INDEX idx_tips_payment_id (payment_id),
  INDEX idx_tips_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_events (
  id         CHAR(36)      PRIMARY KEY,
  tip_id     CHAR(36)      NULL,
  event_type VARCHAR(100)  NOT NULL,
  payload    LONGTEXT      NOT NULL,
  created_at DATETIME      NOT NULL,
  INDEX idx_payment_events_tip_id (tip_id),
  INDEX idx_payment_events_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- creator_id puede ser '__admin__', por eso no es FK
CREATE TABLE IF NOT EXISTS notifications (
  id         CHAR(36)      PRIMARY KEY,
  creator_id VARCHAR(36)   NOT NULL,
  title      VARCHAR(500)  NOT NULL,
  body       TEXT          NULL,
  photo_url  TEXT          NULL,
  image_url  TEXT          NULL,
  is_read    TINYINT(1)    NOT NULL DEFAULT 0,
  is_visible TINYINT(1)    NOT NULL DEFAULT 1,
  created_at DATETIME      NOT NULL,
  updated_at DATETIME      NOT NULL,
  INDEX idx_notifications_creator_id (creator_id),
  INDEX idx_notifications_is_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
