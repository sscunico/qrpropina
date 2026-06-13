# qrpropina

MVP local para cobrar propinas por QR con Mercado Pago.

## Que incluye

- Landing publica en `/`.
- Login privado con Google en `/login`.
- Panel en `/admin` para crear receptores.
- URL publica por receptor: `/t/alias`.
- QR descargable por receptor.
- Seleccion de monto y checkout.
- Comision por receptor.
- Webhook de Mercado Pago para actualizar pagos.
- OAuth preparado para conectar la cuenta Mercado Pago de cada receptor.
- Modo demo local sin credenciales.

## Arranque local

```bash
cp .env.example .env
npm install
npm run dev
```

Abrir:

```text
http://localhost:3000/admin
```

Para usar el login con Google en local, crea credenciales OAuth en Google Cloud y configura:

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
ADMIN_GOOGLE_EMAILS="sscunico@gmail.com"
```

Callback local de Google:

```text
http://localhost:3000/api/auth/google/callback
```

## Dominio

El dominio de produccion sera:

```text
https://qrpropina.com
```

En produccion, la variable debe quedar asi:

```env
APP_URL="https://qrpropina.com"
APP_NAME="qrpropina"
ADMIN_SESSION_SECRET="una-clave-larga-random-para-sesiones"
ADMIN_GOOGLE_EMAILS="sscunico@gmail.com"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

En Google Cloud configura el OAuth Client como "Web application" y agrega estos Redirect URIs:

```text
http://localhost:3000/api/auth/google/callback
https://qrpropina.com/api/auth/google/callback
```

Las URLs que tenes que configurar en Mercado Pago seran:

```text
https://qrpropina.com/api/mercadopago/oauth/callback
https://qrpropina.com/api/mercadopago/webhook
```

## Mercado Pago

Para pruebas locales, deja:

```env
MP_ENABLE_DEMO_CHECKOUT="true"
```

Para pagos reales:

```env
MP_ENABLE_DEMO_CHECKOUT="false"
MERCADOPAGO_ACCESS_TOKEN="TEST-..."
APP_URL="https://qrpropina.com"
```

Para marketplace real, cada receptor debe conectar su cuenta de Mercado Pago desde el boton "Conectar MP". Configura:

```env
MERCADOPAGO_CLIENT_ID="..."
MERCADOPAGO_CLIENT_SECRET="..."
APP_ENCRYPTION_KEY="una-clave-larga-random"
```

El callback OAuth esperado es:

```text
https://qrpropina.com/api/mercadopago/oauth/callback
```

## Despliegue en Hostinger

La app necesita un servidor Node.js porque crea preferencias de pago, recibe webhooks y guarda datos.

Opciones recomendadas:

- VPS en Hostinger con Node.js, PM2 y Nginx.
- Hosting Node.js si tu plan lo soporta.
- Base de datos PostgreSQL o MySQL para produccion.

Para produccion no uses SQLite salvo que sea un VPS chico y aceptes backups manuales frecuentes.

Este MVP local guarda datos en `data/db.json`. Para produccion conviene reemplazar ese almacenamiento por PostgreSQL o MySQL.
