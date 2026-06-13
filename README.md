# qrpropina

MVP local para cobrar propinas por QR con Mercado Pago.

## Que incluye

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

## Dominio

El dominio de produccion sera:

```text
https://qrpropina.com
```

En produccion, la variable debe quedar asi:

```env
APP_URL="https://qrpropina.com"
APP_NAME="qrpropina"
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
