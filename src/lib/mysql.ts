import mysql from "mysql2/promise";

const BASE_CONFIG = {
  port: 3306,
  database: "u758723351_QRP",
  user: "u758723351_sscunico",
  password: "jBx*@CV6%;yGNG8",
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
  results?: { host: string; ok: boolean; message: string }[];
}> {
  if (!BASE_CONFIG.database || !BASE_CONFIG.user) {
    return { ok: false, message: "Variables de entorno MySQL no configuradas." };
  }

  const hosts = [
    process.env.MYSQL_HOST || "auth-db627.hstgr.io",
    "localhost",
    "127.0.0.1",
  ].filter((h, i, arr) => h && arr.indexOf(h) === i);

  const results = await Promise.all(hosts.map(tryHost));
  const success = results.find((r) => r.ok);

  if (success) {
    return {
      ok: true,
      message: `Conectado via "${success.host}" — base de datos: ${BASE_CONFIG.database}`,
      results,
    };
  }

  return {
    ok: false,
    message: results.map((r) => `[${r.host}]: ${r.message}`).join(" | "),
    results,
  };
}
