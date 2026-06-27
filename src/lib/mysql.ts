import mysql from "mysql2/promise";

function getConfig() {
  return {
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    connectTimeout: 5000,
  };
}

export async function testMySQLConnection(): Promise<{ ok: boolean; message: string }> {
  const config = getConfig();

  if (!config.host || config.host === "PENDIENTE" || !config.database || !config.user) {
    return { ok: false, message: "Variables de entorno MySQL no configuradas." };
  }

  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection(config);
    await connection.query("SELECT 1");
    return { ok: true, message: `Conectado a ${config.database} en ${config.host}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return { ok: false, message };
  } finally {
    if (connection) {
      await connection.end().catch(() => {});
    }
  }
}
