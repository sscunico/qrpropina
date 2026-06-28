import mysql from "mysql2/promise";

const BASE_CONFIG = {
  port: parseInt(process.env.DB_PORT || "3306", 10),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  connectTimeout: 5000,
};

async function tryHost(host: string): Promise<{ ok: boolean; message: string; host: string }> {
  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection({ ...BASE_CONFIG, host });
    await connection.query("SELECT 1");
    return { ok: true, message: `Conectado via ${host}`, host };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return { ok: false, message, host };
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}

export async function testMySQLConnection(): Promise<{
  ok: boolean;
  message: string;
  debug?: string;
  results?: { host: string; ok: boolean; message: string }[];
}> {
  const debug = `DB_HOST="${process.env.DB_HOST}" DB_PORT="${process.env.DB_PORT}" DB_DATABASE="${process.env.DB_DATABASE}" DB_USERNAME="${process.env.DB_USERNAME}" DB_PASSWORD="${process.env.DB_PASSWORD ? "***" + process.env.DB_PASSWORD.slice(-3) : "(vacío)"}"`;

  if (!BASE_CONFIG.database || !BASE_CONFIG.user) {
    return { ok: false, message: "Variables de entorno MySQL no configuradas.", debug };
  }

  const hosts = [
    process.env.DB_HOST || "localhost",
    "127.0.0.1",
  ].filter((h, i, arr) => Boolean(h) && arr.indexOf(h) === i) as string[];

  const results = await Promise.all(hosts.map(tryHost));
  const success = results.find((r) => r.ok);

  if (success) {
    return {
      ok: true,
      message: `Conectado via "${success.host}" — base de datos: ${BASE_CONFIG.database}`,
      debug,
      results,
    };
  }

  return {
    ok: false,
    message: results.map((r) => `[${r.host}]: ${r.message}`).join(" | "),
    debug,
    results,
  };
}
