import { promises as fs } from "fs";
import path from "path";

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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreatorQrCode = {
  id: string;
  creatorId: string;
  qrId: string;
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
  isRead: boolean;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AppSettings = {
  showMercadoPagoIntegration: boolean;
  transferDiscountPercent: number;
  updatedAt: string | null;
};

type Db = {
  schemaVersion: 9;
  settings: AppSettings;
  users: User[];
  creators: Creator[];
  qrCodes: CreatorQrCode[];
  tips: Tip[];
  paymentEvents: PaymentEvent[];
  notifications: Notification[];
};

type LegacyCreator = Omit<
  Creator,
  | "ownerUserId"
  | "mpAlias"
  | "mpNickname"
  | "mpEmail"
  | "mpSiteId"
  | "mpFirstName"
  | "mpLastName"
  | "mpCountryId"
  | "mpPermalink"
> & {
  ownerUserId?: string | null;
  mpAlias?: string | null;
  mpNickname?: string | null;
  mpEmail?: string | null;
  mpSiteId?: string | null;
  mpFirstName?: string | null;
  mpLastName?: string | null;
  mpCountryId?: string | null;
  mpPermalink?: string | null;
};

type LegacyTip = Omit<Tip, "creatorId"> & {
  creatorId?: string;
  recipientId?: string;
};

type LegacyDb = Partial<Omit<Db, "tips" | "schemaVersion" | "users" | "creators" | "settings">> & {
    schemaVersion?: number;
  settings?: Partial<AppSettings>;
  users?: User[];
  creators?: LegacyCreator[];
  qrCodes?: CreatorQrCode[];
  recipients?: LegacyCreator[];
  tips?: LegacyTip[];
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

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "db.json");
const backupDir = path.join(dataDir, "backups");

function now() {
  return new Date().toISOString();
}

function defaultSettings(timestamp = now()): AppSettings {
  return {
    showMercadoPagoIntegration: true,
    transferDiscountPercent: 5,
    updatedAt: timestamp
  };
}

function seedDb(): Db {
  const createdAt = now();

  return {
    schemaVersion: 9,
    settings: defaultSettings(createdAt),
    users: [],
    creators: [
      {
        id: crypto.randomUUID(),
        ownerUserId: null,
        displayName: "Juan Perez",
        slug: "juan-perez",
        role: "Mozo",
        locationName: "Bar Demo",
        photoUrl: null,
        mpAlias: null,
        commissionPercent: 5,
        mpUserId: null,
        mpNickname: null,
        mpEmail: null,
        mpSiteId: null,
        mpFirstName: null,
        mpLastName: null,
        mpCountryId: null,
        mpPermalink: null,
        mpAccessToken: null,
        mpRefreshToken: null,
        mpTokenExpiresAt: null,
        isActive: true,
        createdAt,
        updatedAt: createdAt
      },
      {
        id: crypto.randomUUID(),
        ownerUserId: null,
        displayName: "Ana Gomez",
        slug: "ana-gomez",
        role: "Barbera",
        locationName: "Estudio Centro",
        photoUrl: null,
        mpAlias: null,
        commissionPercent: 5,
        mpUserId: null,
        mpNickname: null,
        mpEmail: null,
        mpSiteId: null,
        mpFirstName: null,
        mpLastName: null,
        mpCountryId: null,
        mpPermalink: null,
        mpAccessToken: null,
        mpRefreshToken: null,
        mpTokenExpiresAt: null,
        isActive: true,
        createdAt,
        updatedAt: createdAt
      }
    ],
    qrCodes: [],
    tips: [],
    paymentEvents: [],
    notifications: []
  };
}

function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

function adminEmails() {
  return (process.env.ADMIN_GOOGLE_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((email) => normalizedEmail(email))
    .filter(Boolean);
}

function emailIsAdmin(email: string) {
  return adminEmails().includes(normalizedEmail(email));
}

function normalizeCreator(creator: LegacyCreator): Creator {
  return {
    ...creator,
    ownerUserId: creator.ownerUserId || null,
    mpAlias: creator.mpAlias || null,
    mpNickname: creator.mpNickname || null,
    mpEmail: creator.mpEmail || null,
    mpSiteId: creator.mpSiteId || null,
    mpFirstName: creator.mpFirstName || null,
    mpLastName: creator.mpLastName || null,
    mpCountryId: creator.mpCountryId || null,
    mpPermalink: creator.mpPermalink || null
  };
}

function normalizeTip(tip: LegacyTip): Tip {
  const { recipientId: _legacyRecipientId, ...rest } = tip;
  return {
    ...rest,
    creatorId: tip.creatorId || tip.recipientId || ""
  };
}

function normalizeTransferDiscountPercent(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 40) {
    return 5;
  }

  return parsed;
}

function normalizeSettings(settings: Partial<AppSettings> | undefined, timestamp: string): AppSettings {
  return {
    showMercadoPagoIntegration: settings?.showMercadoPagoIntegration !== false,
    transferDiscountPercent: normalizeTransferDiscountPercent(settings?.transferDiscountPercent),
    updatedAt: settings?.updatedAt || timestamp
  };
}

function normalizeDb(raw: LegacyDb): { db: Db; migrated: boolean } {
  let migrated =
    raw.schemaVersion !== 9 ||
    !raw.settings ||
    typeof raw.settings.transferDiscountPercent !== "number" ||
    !raw.creators ||
    !raw.users ||
    !raw.qrCodes ||
    !raw.notifications;
  const creators = Array.isArray(raw.creators)
    ? raw.creators
    : Array.isArray(raw.recipients)
      ? raw.recipients
      : [];
  const qrCodes = Array.isArray(raw.qrCodes) ? raw.qrCodes : [];
  const timestamp = now();
  const users = Array.isArray(raw.users) ? raw.users : [];

  for (const email of adminEmails()) {
    const existingAdmin = users.find((user) => normalizedEmail(user.email) === email);
    if (existingAdmin) {
      if (existingAdmin.role !== "admin" || existingAdmin.creatorId) {
        existingAdmin.role = "admin";
        existingAdmin.creatorId = null;
        existingAdmin.updatedAt = timestamp;
        migrated = true;
      }
    } else {
      users.push({
        id: crypto.randomUUID(),
        email,
        name: email,
        picture: null,
        role: "admin",
        creatorId: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastLoginAt: null
      });
      migrated = true;
    }
  }

  return {
    migrated,
    db: {
      schemaVersion: 9,
      settings: normalizeSettings(raw.settings, timestamp),
      users,
      creators: creators.map(normalizeCreator),
      qrCodes,
      tips: Array.isArray(raw.tips) ? raw.tips.map(normalizeTip) : [],
      paymentEvents: Array.isArray(raw.paymentEvents) ? raw.paymentEvents : [],
      notifications: Array.isArray(raw.notifications) ? raw.notifications : []
    }
  };
}

async function readDb(): Promise<Db> {
  try {
    const raw = await fs.readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as LegacyDb;
    const { db, migrated } = normalizeDb(parsed);

    if (migrated) {
      await writeDb(db);
    }

    return db;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    const db = seedDb();
    await writeDb(db);
    return db;
  }
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function createDailyBackup() {
  if (!(await fileExists(dbPath))) {
    return;
  }

  await fs.mkdir(backupDir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const backupPath = path.join(backupDir, `db-${date}.json`);

  if (await fileExists(backupPath)) {
    return;
  }

  await fs.copyFile(dbPath, backupPath);
}

async function writeDb(db: Db) {
  await fs.mkdir(dataDir, { recursive: true });
  await createDailyBackup();

  const content = JSON.stringify(db, null, 2);
  const tmpPath = path.join(dataDir, `db.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tmpPath, content, "utf8");

  try {
    await fs.rename(tmpPath, dbPath);
  } catch (err) {
    // On Windows, rename over a watched file fails with EPERM — fall back to direct write.
    if ((err as NodeJS.ErrnoException).code === "EPERM") {
      await fs.writeFile(dbPath, content, "utf8");
      await fs.unlink(tmpPath).catch(() => {});
    } else {
      await fs.unlink(tmpPath).catch(() => {});
      throw err;
    }
  }
}

let mutationQueue: Promise<void> = Promise.resolve();

async function mutateDb<T>(mutator: (db: Db) => T | Promise<T>) {
  const run = mutationQueue.then(async () => {
    const db = await readDb();
    const result = await mutator(db);
    await writeDb(db);
    return result;
  });

  mutationQueue = run.then(
    () => undefined,
    () => undefined
  );

  return run;
}

function sortNewest<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function isApprovedTip(tip: Pick<Tip, "status">) {
  return tip.status === "approved";
}

async function inspectStorage(): Promise<StorageInfo> {
  try {
    const stats = await fs.stat(dbPath);
    return {
      dbPath,
      backupDir,
      exists: true,
      sizeBytes: stats.size,
      updatedAt: stats.mtime.toISOString()
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    return {
      dbPath,
      backupDir,
      exists: false,
      sizeBytes: 0,
      updatedAt: null
    };
  }
}

export async function getStorageInfo() {
  await readDb();
  return inspectStorage();
}

export async function getAppSettings() {
  const db = await readDb();
  return db.settings;
}

export async function setMercadoPagoIntegrationVisible(showMercadoPagoIntegration: boolean) {
  return mutateDb((db) => {
    db.settings.showMercadoPagoIntegration = showMercadoPagoIntegration;
    db.settings.updatedAt = now();
    return db.settings;
  });
}

export async function setTransferDiscountPercentValue(transferDiscountPercent: number) {
  return mutateDb((db) => {
    db.settings.transferDiscountPercent = normalizeTransferDiscountPercent(transferDiscountPercent);
    db.settings.updatedAt = now();
    return db.settings;
  });
}

export async function exportDbSnapshot() {
  const db = await readDb();

  return {
    app: "qrpropina",
    exportedAt: now(),
    storage: await inspectStorage(),
    data: db
  };
}

export async function listCreatorsWithRecentTips(take = 5): Promise<CreatorWithTips[]> {
  const db = await readDb();
  return sortNewest(db.creators).map((creator) => ({
    ...creator,
    qrCodes: sortNewest(db.qrCodes.filter((qrCode) => qrCode.creatorId === creator.id)),
    tips: sortNewest(db.tips.filter((tip) => tip.creatorId === creator.id)).slice(0, take)
  }));
}

export async function aggregateTips() {
  const db = await readDb();
  return db.tips.filter(isApprovedTip).reduce(
    (totals, tip) => ({
      count: totals.count + 1,
      amountCents: totals.amountCents + tip.amountCents,
      platformFeeCents: totals.platformFeeCents + tip.platformFeeCents
    }),
    { count: 0, amountCents: 0, platformFeeCents: 0 }
  );
}

export async function getCreatorBySlug(slug: string) {
  const db = await readDb();
  return db.creators.find((creator) => creator.slug === slug) || null;
}

export async function getCreatorWithTips(id: string, take = 12): Promise<CreatorWithTips | null> {
  const db = await readDb();
  const creator = db.creators.find((item) => item.id === id);
  if (!creator) {
    return null;
  }

  return {
    ...creator,
    qrCodes: sortNewest(db.qrCodes.filter((qrCode) => qrCode.creatorId === id)),
    tips: sortNewest(db.tips.filter((tip) => tip.creatorId === id)).slice(0, take)
  };
}

export async function createCreatorRecord(input: {
  displayName: string;
  slug: string;
  role?: string | null;
  locationName?: string | null;
  commissionPercent: number;
  ownerUserId?: string | null;
}) {
  return mutateDb((db) => {
    if (db.creators.some((creator) => creator.slug === input.slug)) {
      throw new Error("Ese alias ya existe.");
    }

    const timestamp = now();
    const creator: Creator = {
      id: crypto.randomUUID(),
      ownerUserId: input.ownerUserId || null,
      displayName: input.displayName,
      slug: input.slug,
      role: input.role || null,
      locationName: input.locationName || null,
      photoUrl: null,
      mpAlias: null,
      commissionPercent: input.commissionPercent,
      mpUserId: null,
      mpNickname: null,
      mpEmail: null,
      mpSiteId: null,
      mpFirstName: null,
      mpLastName: null,
      mpCountryId: null,
      mpPermalink: null,
      mpAccessToken: null,
      mpRefreshToken: null,
      mpTokenExpiresAt: null,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    db.creators.push(creator);
    return creator;
  });
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42) || "creador";
}

function uniqueCreatorSlug(db: Db, value: string) {
  const base = slugify(value);
  let slug = base;
  let index = 2;

  while (db.creators.some((creator) => creator.slug === slug)) {
    slug = `${base}-${index}`;
    index += 1;
  }

  return slug;
}

export async function upsertGoogleUser(input: {
  email: string;
  name?: string | null;
  picture?: string | null;
}) {
  return mutateDb((db) => {
    const timestamp = now();
    const email = normalizedEmail(input.email);
    const role: UserRole = emailIsAdmin(email) ? "admin" : "creator";
    let user = db.users.find((item) => normalizedEmail(item.email) === email);

    if (!user) {
      user = {
        id: crypto.randomUUID(),
        email,
        name: input.name || null,
        picture: input.picture || null,
        role,
        creatorId: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastLoginAt: timestamp
      };
      db.users.push(user);
    }

    user.name = input.name || user.name || null;
    user.picture = input.picture || user.picture || null;
    user.role = role;
    user.updatedAt = timestamp;
    user.lastLoginAt = timestamp;

    if (role === "creator") {
      let creator = user.creatorId
        ? db.creators.find((item) => item.id === user.creatorId)
        : null;

      if (!creator) {
        creator = {
          id: crypto.randomUUID(),
          ownerUserId: user.id,
          displayName: input.name || email.split("@")[0],
          slug: uniqueCreatorSlug(db, input.name || email.split("@")[0]),
          role: "Creador",
          locationName: null,
          photoUrl: input.picture || null,
          mpAlias: null,
          commissionPercent: 5,
          mpUserId: null,
          mpNickname: null,
          mpEmail: null,
          mpSiteId: null,
          mpFirstName: null,
          mpLastName: null,
          mpCountryId: null,
          mpPermalink: null,
          mpAccessToken: null,
          mpRefreshToken: null,
          mpTokenExpiresAt: null,
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp
        };
        db.creators.push(creator);
      } else {
        creator.ownerUserId = user.id;
        creator.photoUrl = input.picture || creator.photoUrl || null;
        creator.updatedAt = timestamp;
      }

      user.creatorId = creator.id;
    } else {
      user.creatorId = null;
    }

    return { user };
  });
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
  return mutateDb((db) => {
    const creator = db.creators.find((item) => item.id === id);
    if (!creator) {
      throw new Error("Creador no encontrado.");
    }

    if (db.creators.some((item) => item.id !== id && item.slug === input.slug)) {
      throw new Error("Ese alias ya existe.");
    }

    Object.assign(creator, {
      displayName: input.displayName,
      slug: input.slug,
      role: input.role || null,
      locationName: input.locationName || null,
      commissionPercent: input.commissionPercent,
      updatedAt: now()
    });

    return creator;
  });
}

export async function deleteCreatorRecord(id: string) {
  return mutateDb((db) => {
    const creatorIndex = db.creators.findIndex((item) => item.id === id);
    if (creatorIndex === -1) {
      throw new Error("Creador no encontrado.");
    }

    const [creator] = db.creators.splice(creatorIndex, 1);
    const tipIds = new Set(db.tips.filter((tip) => tip.creatorId === id).map((tip) => tip.id));

    db.qrCodes = db.qrCodes.filter((qrCode) => qrCode.creatorId !== id);
    db.tips = db.tips.filter((tip) => tip.creatorId !== id);
    db.notifications = db.notifications.filter((notification) => notification.creatorId !== id);
    db.paymentEvents = db.paymentEvents.filter((event) => !event.tipId || !tipIds.has(event.tipId));

    for (const user of db.users) {
      if (user.creatorId === id) {
        user.creatorId = null;
        user.updatedAt = now();
      }
    }

    return creator;
  });
}

export async function updateCreatorProfileRecord(
  id: string,
  input: {
    displayName: string;
    slug: string;
    role?: string | null;
    locationName?: string | null;
  }
) {
  return mutateDb((db) => {
    const creator = db.creators.find((item) => item.id === id);
    if (!creator) {
      throw new Error("Creador no encontrado.");
    }

    if (db.creators.some((item) => item.id !== id && item.slug === input.slug)) {
      throw new Error("Ese alias ya existe.");
    }

    Object.assign(creator, {
      displayName: input.displayName,
      slug: input.slug,
      role: input.role || null,
      locationName: input.locationName || null,
      updatedAt: now()
    });

    return creator;
  });
}

export function normalizeMercadoPagoAlias(value: string) {
  return value.trim().toLowerCase();
}

function validateMercadoPagoAlias(value: string) {
  const alias = normalizeMercadoPagoAlias(value);
  if (!alias) {
    throw new Error("Ingresa un alias de Mercado Pago.");
  }

  if (!/^[a-z0-9](?:[a-z0-9.-]{4,38}[a-z0-9])$/.test(alias)) {
    throw new Error("Usa entre 6 y 40 caracteres: letras, números, punto o guion.");
  }

  return alias;
}

function mercadoPagoAliasExists(db: Db, alias: string, exceptCreatorId?: string | null) {
  return db.creators.some(
    (creator) => creator.id !== exceptCreatorId && creator.mpAlias === alias
  );
}

export async function checkMercadoPagoAlias(input: string, exceptCreatorId?: string | null) {
  try {
    const alias = validateMercadoPagoAlias(input);
    const db = await readDb();
    const exists = mercadoPagoAliasExists(db, alias, exceptCreatorId);

    return {
      alias,
      exists,
      available: !exists,
      valid: true,
      message: exists
        ? "Ese alias ya esta cargado en qrpropina."
        : "Alias disponible en qrpropina."
    };
  } catch (error) {
    return {
      alias: normalizeMercadoPagoAlias(input),
      exists: false,
      available: false,
      valid: false,
      message: error instanceof Error ? error.message : "Alias inválido."
    };
  }
}

export async function updateCreatorMercadoPagoAliasRecord(id: string, aliasInput: string) {
  return mutateDb((db) => {
    const creator = db.creators.find((item) => item.id === id);
    if (!creator) {
      throw new Error("Creador no encontrado.");
    }

    const alias = validateMercadoPagoAlias(aliasInput);
    if (mercadoPagoAliasExists(db, alias, id)) {
      throw new Error("Ese alias ya esta cargado en qrpropina.");
    }

    creator.mpAlias = alias;
    creator.updatedAt = now();
    return creator;
  });
}

export function normalizeQrId(value: string) {
  return value.trim().toLowerCase();
}

function validateQrId(value: string) {
  const qrId = normalizeQrId(value);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(qrId)) {
    throw new Error("El ID del QR solo puede tener letras, números y guiones.");
  }

  if (qrId.length > 64) {
    throw new Error("El ID del QR no puede superar 64 caracteres.");
  }

  return qrId;
}

function qrIdExists(db: Db, qrId: string, exceptRecordId?: string | null) {
  return db.qrCodes.some((item) => item.id !== exceptRecordId && item.qrId === qrId);
}

export async function checkQrIdAvailability(input: string, exceptRecordId?: string | null) {
  try {
    const qrId = validateQrId(input);
    const db = await readDb();
    const exists = qrIdExists(db, qrId, exceptRecordId);

    return {
      qrId,
      exists,
      available: !exists,
      valid: true,
      message: exists ? "QR existente." : "ID disponible."
    };
  } catch (error) {
    return {
      qrId: normalizeQrId(input),
      exists: false,
      available: false,
      valid: false,
      message: error instanceof Error ? error.message : "ID inválido."
    };
  }
}

export async function createQrCodeRecord(input: { creatorId: string; qrId: string }) {
  return mutateDb((db) => {
    const creator = db.creators.find((item) => item.id === input.creatorId);
    if (!creator) {
      throw new Error("Creador no encontrado.");
    }

    const creatorQrCount = db.qrCodes.filter((item) => item.creatorId === input.creatorId).length;
    if (creatorQrCount >= 30) {
      throw new Error("Cada creador puede tener como máximo 30 QR.");
    }

    const qrId = validateQrId(input.qrId);
    if (qrIdExists(db, qrId)) {
      throw new Error("Ese ID ya existe.");
    }

    const timestamp = now();
    const qrCode: CreatorQrCode = {
      id: crypto.randomUUID(),
      creatorId: input.creatorId,
      qrId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    db.qrCodes.push(qrCode);
    return qrCode;
  });
}

export async function updateQrCodeRecord(input: {
  creatorId: string;
  recordId: string;
  qrId: string;
}) {
  return mutateDb((db) => {
    const qrCode = db.qrCodes.find(
      (item) => item.id === input.recordId && item.creatorId === input.creatorId
    );
    if (!qrCode) {
      throw new Error("QR no encontrado.");
    }

    const qrId = validateQrId(input.qrId);
    if (qrIdExists(db, qrId, input.recordId)) {
      throw new Error("Ese ID ya existe.");
    }

    qrCode.qrId = qrId;
    qrCode.updatedAt = now();
    return qrCode;
  });
}

export async function deleteQrCodeRecord(input: { creatorId: string; recordId: string }) {
  return mutateDb((db) => {
    const index = db.qrCodes.findIndex(
      (item) => item.id === input.recordId && item.creatorId === input.creatorId
    );
    if (index === -1) {
      throw new Error("QR no encontrado.");
    }

    const [deleted] = db.qrCodes.splice(index, 1);
    return deleted;
  });
}

export async function getQrCodeWithCreatorByQrId(qrIdInput: string): Promise<QrCodeWithCreator | null> {
  const qrId = normalizeQrId(qrIdInput);
  const db = await readDb();
  const qrCode = db.qrCodes.find((item) => item.qrId === qrId);
  if (!qrCode) {
    return null;
  }

  const creator = db.creators.find((item) => item.id === qrCode.creatorId);
  if (!creator) {
    return null;
  }

  return { ...qrCode, creator };
}

export async function setCreatorActive(id: string, isActive: boolean) {
  return mutateDb((db) => {
    const creator = db.creators.find((item) => item.id === id);
    if (!creator) {
      throw new Error("Creador no encontrado.");
    }

    creator.isActive = isActive;
    creator.updatedAt = now();
    return creator;
  });
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
  return mutateDb((db) => {
    const creator = db.creators.find((item) => item.id === id);
    if (!creator) {
      throw new Error("Creador no encontrado.");
    }

    creator.mpUserId = input.userId;
    creator.mpNickname = input.account?.nickname || null;
    creator.mpEmail = input.account?.email || null;
    creator.mpSiteId = input.account?.siteId || null;
    creator.mpFirstName = input.account?.firstName || null;
    creator.mpLastName = input.account?.lastName || null;
    creator.mpCountryId = input.account?.countryId || null;
    creator.mpPermalink = input.account?.permalink || null;

    if (input.account?.nickname) {
      try {
        const detectedAlias = validateMercadoPagoAlias(input.account.nickname);
        if (!mercadoPagoAliasExists(db, detectedAlias, id)) {
          creator.mpAlias = detectedAlias;
        }
      } catch {
        // El nickname de Mercado Pago puede no respetar nuestro formato de alias.
      }
    }

    creator.mpAccessToken = input.accessToken;
    creator.mpRefreshToken = input.refreshToken;
    creator.mpTokenExpiresAt = input.expiresAt?.toISOString() || null;
    creator.updatedAt = now();
    return creator;
  });
}

export async function createTipRecord(input: {
  creatorId: string;
  amountCents: number;
  platformFeeCents: number;
  payerEmail?: string | null;
  externalReference: string;
}) {
  return mutateDb((db) => {
    const timestamp = now();
    const tip: Tip = {
      id: crypto.randomUUID(),
      creatorId: input.creatorId,
      amountCents: input.amountCents,
      platformFeeCents: input.platformFeeCents,
      currency: "ARS",
      status: "created",
      preferenceId: null,
      paymentId: null,
      externalReference: input.externalReference,
      checkoutUrl: null,
      payerEmail: input.payerEmail || null,
      rawPayment: null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    db.tips.push(tip);
    return tip;
  });
}

export async function updateTipRecord(id: string, data: Partial<Omit<Tip, "id" | "createdAt">>) {
  return mutateDb((db) => {
    const tip = db.tips.find((item) => item.id === id);
    if (!tip) {
      throw new Error("Propina no encontrada.");
    }

    Object.assign(tip, data, { updatedAt: now() });
    return tip;
  });
}

export async function getTipWithCreator(id: string): Promise<TipWithCreator | null> {
  const db = await readDb();
  const tip = db.tips.find((item) => item.id === id);
  if (!tip) {
    return null;
  }

  const creator = db.creators.find((item) => item.id === tip.creatorId);
  if (!creator) {
    return null;
  }

  return { ...tip, creator };
}

export async function updateTipFromPayment(input: {
  tipId?: string | null;
  externalReference?: string | null;
  paymentId?: string | null;
  status: string;
  rawPayment: string;
}) {
  return mutateDb((db) => {
    const tip = db.tips.find((item) => {
      if (input.tipId && item.id === input.tipId) {
        return true;
      }
      if (input.externalReference && item.externalReference === input.externalReference) {
        return true;
      }
      return Boolean(input.paymentId && item.paymentId === input.paymentId);
    });

    if (!tip) {
      return null;
    }

    tip.paymentId = input.paymentId || tip.paymentId;
    tip.status = input.status;
    tip.rawPayment = input.rawPayment;
    tip.updatedAt = now();
    return tip;
  });
}

export async function addPaymentEvent(input: {
  tipId?: string | null;
  eventType: string;
  payload: string;
}) {
  await mutateDb((db) => {
    db.paymentEvents.push({
      id: crypto.randomUUID(),
      tipId: input.tipId || null,
      eventType: input.eventType,
      payload: input.payload,
      createdAt: now()
    });
  });
}

export async function listPaymentEvents(limit = 200): Promise<PaymentEvent[]> {
  const db = await readDb();
  return sortNewest(db.paymentEvents).slice(0, limit);
}

export async function listNotificationsForCreator(
  creatorId: string,
  page = 1,
  pageSize = 30
): Promise<{ items: Notification[]; total: number; totalPages: number }> {
  const db = await readDb();
  const all = sortNewest(
    db.notifications.filter((n) => n.creatorId === creatorId && n.isVisible)
  );
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const offset = (safePage - 1) * pageSize;
  return { items: all.slice(offset, offset + pageSize), total, totalPages };
}

export async function countUnreadNotificationsForCreator(creatorId: string): Promise<number> {
  const db = await readDb();
  return db.notifications.filter(
    (n) => n.creatorId === creatorId && n.isVisible && !n.isRead
  ).length;
}

export async function softDeleteNotificationRecord(id: string, creatorId: string) {
  return mutateDb((db) => {
    const n = db.notifications.find((item) => item.id === id && item.creatorId === creatorId);
    if (!n) throw new Error("Notificación no encontrada.");
    n.isVisible = false;
    n.updatedAt = now();
    return n;
  });
}

export async function markNotificationsReadForCreator(creatorId: string) {
  return mutateDb((db) => {
    const timestamp = now();
    let count = 0;
    for (const n of db.notifications) {
      if (n.creatorId === creatorId && n.isVisible && !n.isRead) {
        n.isRead = true;
        n.updatedAt = timestamp;
        count++;
      }
    }
    return count;
  });
}

export async function createNotificationRecord(input: {
  creatorId: string;
  title: string;
  body?: string | null;
}) {
  return mutateDb((db) => {
    const timestamp = now();
    const notification: Notification = {
      id: crypto.randomUUID(),
      creatorId: input.creatorId,
      title: input.title,
      body: input.body || null,
      isRead: false,
      isVisible: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    db.notifications.push(notification);
    return notification;
  });
}
