import { promises as fs } from "fs";
import path from "path";

export type Recipient = {
  id: string;
  displayName: string;
  slug: string;
  role: string | null;
  locationName: string | null;
  photoUrl: string | null;
  commissionPercent: number;
  mpUserId: string | null;
  mpAccessToken: string | null;
  mpRefreshToken: string | null;
  mpTokenExpiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Tip = {
  id: string;
  recipientId: string;
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

type Db = {
  recipients: Recipient[];
  tips: Tip[];
  paymentEvents: PaymentEvent[];
};

export type RecipientWithTips = Recipient & {
  tips: Tip[];
};

export type TipWithRecipient = Tip & {
  recipient: Recipient;
};

const dbPath = path.join(process.cwd(), "data", "db.json");

function now() {
  return new Date().toISOString();
}

function seedDb(): Db {
  const createdAt = now();

  return {
    recipients: [
      {
        id: crypto.randomUUID(),
        displayName: "Juan Perez",
        slug: "juan-perez",
        role: "Mozo",
        locationName: "Bar Demo",
        photoUrl: null,
        commissionPercent: 8,
        mpUserId: null,
        mpAccessToken: null,
        mpRefreshToken: null,
        mpTokenExpiresAt: null,
        isActive: true,
        createdAt,
        updatedAt: createdAt
      },
      {
        id: crypto.randomUUID(),
        displayName: "Ana Gomez",
        slug: "ana-gomez",
        role: "Barbera",
        locationName: "Estudio Centro",
        photoUrl: null,
        commissionPercent: 8,
        mpUserId: null,
        mpAccessToken: null,
        mpRefreshToken: null,
        mpTokenExpiresAt: null,
        isActive: true,
        createdAt,
        updatedAt: createdAt
      }
    ],
    tips: [],
    paymentEvents: []
  };
}

async function readDb(): Promise<Db> {
  try {
    const raw = await fs.readFile(dbPath, "utf8");
    return JSON.parse(raw) as Db;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    const db = seedDb();
    await writeDb(db);
    return db;
  }
}

async function writeDb(db: Db) {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
}

function sortNewest<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listRecipientsWithRecentTips(take = 5): Promise<RecipientWithTips[]> {
  const db = await readDb();
  return sortNewest(db.recipients).map((recipient) => ({
    ...recipient,
    tips: sortNewest(db.tips.filter((tip) => tip.recipientId === recipient.id)).slice(0, take)
  }));
}

export async function aggregateTips() {
  const db = await readDb();
  return db.tips.reduce(
    (totals, tip) => ({
      count: totals.count + 1,
      amountCents: totals.amountCents + tip.amountCents,
      platformFeeCents: totals.platformFeeCents + tip.platformFeeCents
    }),
    { count: 0, amountCents: 0, platformFeeCents: 0 }
  );
}

export async function getRecipientBySlug(slug: string) {
  const db = await readDb();
  return db.recipients.find((recipient) => recipient.slug === slug) || null;
}

export async function getRecipientWithTips(id: string, take = 12): Promise<RecipientWithTips | null> {
  const db = await readDb();
  const recipient = db.recipients.find((item) => item.id === id);
  if (!recipient) {
    return null;
  }

  return {
    ...recipient,
    tips: sortNewest(db.tips.filter((tip) => tip.recipientId === id)).slice(0, take)
  };
}

export async function createRecipientRecord(input: {
  displayName: string;
  slug: string;
  role?: string | null;
  locationName?: string | null;
  commissionPercent: number;
}) {
  const db = await readDb();
  if (db.recipients.some((recipient) => recipient.slug === input.slug)) {
    throw new Error("Ese alias ya existe.");
  }

  const timestamp = now();
  const recipient: Recipient = {
    id: crypto.randomUUID(),
    displayName: input.displayName,
    slug: input.slug,
    role: input.role || null,
    locationName: input.locationName || null,
    photoUrl: null,
    commissionPercent: input.commissionPercent,
    mpUserId: null,
    mpAccessToken: null,
    mpRefreshToken: null,
    mpTokenExpiresAt: null,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  db.recipients.push(recipient);
  await writeDb(db);
  return recipient;
}

export async function updateRecipientRecord(
  id: string,
  input: {
    displayName: string;
    slug: string;
    role?: string | null;
    locationName?: string | null;
    commissionPercent: number;
  }
) {
  const db = await readDb();
  const recipient = db.recipients.find((item) => item.id === id);
  if (!recipient) {
    throw new Error("Receptor no encontrado.");
  }

  if (db.recipients.some((item) => item.id !== id && item.slug === input.slug)) {
    throw new Error("Ese alias ya existe.");
  }

  Object.assign(recipient, {
    displayName: input.displayName,
    slug: input.slug,
    role: input.role || null,
    locationName: input.locationName || null,
    commissionPercent: input.commissionPercent,
    updatedAt: now()
  });

  await writeDb(db);
  return recipient;
}

export async function setRecipientActive(id: string, isActive: boolean) {
  const db = await readDb();
  const recipient = db.recipients.find((item) => item.id === id);
  if (!recipient) {
    throw new Error("Receptor no encontrado.");
  }

  recipient.isActive = isActive;
  recipient.updatedAt = now();
  await writeDb(db);
  return recipient;
}

export async function connectRecipientMercadoPago(
  id: string,
  input: {
    userId: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: Date | null;
  }
) {
  const db = await readDb();
  const recipient = db.recipients.find((item) => item.id === id);
  if (!recipient) {
    throw new Error("Receptor no encontrado.");
  }

  recipient.mpUserId = input.userId;
  recipient.mpAccessToken = input.accessToken;
  recipient.mpRefreshToken = input.refreshToken;
  recipient.mpTokenExpiresAt = input.expiresAt?.toISOString() || null;
  recipient.updatedAt = now();
  await writeDb(db);
  return recipient;
}

export async function createTipRecord(input: {
  recipientId: string;
  amountCents: number;
  platformFeeCents: number;
  payerEmail?: string | null;
  externalReference: string;
}) {
  const db = await readDb();
  const timestamp = now();
  const tip: Tip = {
    id: crypto.randomUUID(),
    recipientId: input.recipientId,
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
  await writeDb(db);
  return tip;
}

export async function updateTipRecord(id: string, data: Partial<Omit<Tip, "id" | "createdAt">>) {
  const db = await readDb();
  const tip = db.tips.find((item) => item.id === id);
  if (!tip) {
    throw new Error("Propina no encontrada.");
  }

  Object.assign(tip, data, { updatedAt: now() });
  await writeDb(db);
  return tip;
}

export async function getTipWithRecipient(id: string): Promise<TipWithRecipient | null> {
  const db = await readDb();
  const tip = db.tips.find((item) => item.id === id);
  if (!tip) {
    return null;
  }

  const recipient = db.recipients.find((item) => item.id === tip.recipientId);
  if (!recipient) {
    return null;
  }

  return { ...tip, recipient };
}

export async function updateTipFromPayment(input: {
  tipId?: string | null;
  externalReference?: string | null;
  paymentId?: string | null;
  status: string;
  rawPayment: string;
}) {
  const db = await readDb();
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
  await writeDb(db);
  return tip;
}

export async function addPaymentEvent(input: {
  tipId?: string | null;
  eventType: string;
  payload: string;
}) {
  const db = await readDb();
  db.paymentEvents.push({
    id: crypto.randomUUID(),
    tipId: input.tipId || null,
    eventType: input.eventType,
    payload: input.payload,
    createdAt: now()
  });

  await writeDb(db);
}
