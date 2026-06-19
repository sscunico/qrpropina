# qrpropina

MVP local para cobrar propinas por QR con Mercado Pago.

## Que incluye

- Landing publica en `/`.
- Login privado con Google en `/login`.
- Panel en `/admin` para crear creadores.
- URL publica por creador: `/t/alias`.
- QR descargable por creador.
- Seleccion de monto y checkout.
- Comision por creador.
- Webhook de Mercado Pago para actualizar pagos.
- OAuth con PKCE para conectar la cuenta Mercado Pago de cada creador.
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

Para compras de prueba locales, usa siempre credenciales de prueba:

```env
APP_URL="http://localhost:3000"
MP_ENABLE_DEMO_CHECKOUT="false"
MERCADOPAGO_ACCESS_TOKEN="TEST-..."
MERCADOPAGO_USE_SANDBOX_LINK="true"
```

El token debe ser del vendedor de prueba. El comprador debe ser otra cuenta de prueba distinta y la compra debe hacerse en una ventana de incognito.

### Compra de prueba

1. Inicia la app local con `npm run dev`.
2. Abre una ventana de incognito.
3. Entra a una URL publica de propina, por ejemplo `http://localhost:3000/q/ID_DEL_QR`.
4. Elegi un monto y presiona el boton de pago.
5. Inicia sesion en Mercado Pago con el comprador de prueba.
6. Usa una tarjeta de prueba y el nombre del titular segun el resultado que quieras simular.

Tarjetas utiles:

```text
Visa credito:        4509 9535 6623 3704 | CVV 123  | vence 11/30
Mastercard credito:  5031 7557 3453 0604 | CVV 123  | vence 11/30
Visa debito:         4002 7686 9439 5619 | CVV 123  | vence 11/30
```

Titulares para simular resultado:

```text
APRO + DNI 12345678 = pago aprobado
OTHE + DNI 12345678 = rechazo general
CONT                 = pago pendiente
FUND                 = fondos insuficientes
SECU                 = codigo de seguridad invalido
```

En local con `localhost`, Mercado Pago no puede llamar a nuestro webhook ni volver correctamente por `back_urls`. Para probar notificaciones y retorno automatico, usa una URL HTTPS temporal, por ejemplo ngrok, y configura `APP_URL` con esa URL.

Para marketplace real, cada creador debe conectar su cuenta de Mercado Pago desde el boton "Integrar Mercado Pago". Configura:

```env
MERCADOPAGO_CLIENT_ID="..."
MERCADOPAGO_CLIENT_SECRET="..."
MERCADOPAGO_WEBHOOK_SECRET="..."
APP_ENCRYPTION_KEY="una-clave-larga-random"
```

El callback OAuth esperado es:

```text
http://localhost:3000/api/mercadopago/oauth/callback
https://qrpropina.com/api/mercadopago/oauth/callback
```

En la aplicacion de Mercado Pago, habilita el flujo Authorization Code con PKCE si aparece la opcion. La app envia `state`, `code_challenge` y luego canjea el `code` con `code_verifier`.

### Notificaciones de pago

La app recibe webhooks de Mercado Pago en:

```text
https://qrpropina.com/api/mercadopago/webhook
```

En Mercado Pago Developers:

1. Entra a Tus integraciones.
2. Abre la aplicacion de qrpropina.
3. Entra a Webhooks > Configurar notificaciones.
4. En Modo productivo carga la URL HTTPS anterior.
5. Activa el evento Pagos.
6. Guarda la configuracion y copia la clave secreta generada en `MERCADOPAGO_WEBHOOK_SECRET`.

Ademas, cuando `APP_URL` usa HTTPS, qrpropina tambien envia `notification_url` al crear cada preferencia:

```text
https://qrpropina.com/api/mercadopago/webhook?tipId=ID_DE_PROPINA
```

Esto permite asociar cada notificacion con la propina local. En local con `localhost` no se configuran notificaciones reales; para probar webhooks locales usa una URL HTTPS publica temporal como ngrok y ponela en `APP_URL`.

## Despliegue en Hostinger

La app necesita un servidor Node.js porque crea preferencias de pago, recibe webhooks y guarda datos.

Opciones recomendadas:

- VPS en Hostinger con Node.js, PM2 y Nginx.
- Hosting Node.js si tu plan lo soporta.
- Base de datos PostgreSQL o MySQL para produccion.

Para produccion no uses SQLite salvo que sea un VPS chico y aceptes backups manuales frecuentes.

## Datos locales

Este MVP local guarda creadores, propinas y eventos en una base local JSON versionada:

```text
data/db.json
```

En local no hay usuario y clave de base tipo MySQL: la base es ese archivo JSON. Para verla podes abrir `data/db.json` desde el proyecto, o descargar un backup desde el panel admin.

Ese archivo no se sube a GitHub. El admin tambien permite descargar un backup desde `/admin`, y la app crea un backup automatico diario en:

```text
data/backups
```

Las colecciones principales son:

- `users`: usuarios que entran con Google.
- `creators`: perfiles publicos que reciben propinas.
- `qrCodes`: IDs de QR asociados a cada creador.
- `tips`: propinas asociadas por `creatorId`.
- `paymentEvents`: eventos recibidos por webhook.

Roles:

- `admin`: emails configurados en `ADMIN_GOOGLE_EMAILS`, por ejemplo `sscunico@gmail.com`.
- `creator`: cualquier cuenta Google verificada que entra por primera vez y no es admin.

Si entra un usuario nuevo con Google, la app crea un registro en `users` con rol `creator` y tambien crea su perfil en `creators`. Si existe un archivo viejo con `recipients`, la app lo migra automaticamente al formato nuevo.

QR por creador:

- Cada creador puede tener hasta 30 QR.
- Cada QR usa una URL publica con este formato: `/q/id`.
- El ID solo permite letras, numeros y guiones.
- Los IDs no se pueden repetir entre creadores.
- Si se elimina un QR, ese ID queda libre para volver a usarse.

Los backups pueden incluir datos sensibles de creadores y pagos. Para produccion conviene reemplazar este almacenamiento por PostgreSQL o MySQL.
