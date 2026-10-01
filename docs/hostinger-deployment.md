# Despliegue — Control Inventario + CRM

Procedimiento **específico de este proyecto**. No reutilizar tal cual la guía de
otros proyectos del mismo servidor (p. ej. `dashboard-RRHH`): **ese usa tokens
Bearer; este usa Laravel Sanctum con cookies de sesión (SPA)**, lo que cambia
CORS, `SESSION_*`, `SANCTUM_STATEFUL_DOMAINS` y obliga a que frontend y backend
vivan bajo el **mismo dominio raíz**.

## Arquitectura

```text
demo-inventario-crm.fidelmercadotech.com       -> Frontend (Next.js 16, Vercel, dominio personalizado)
demo-inventario-crm-api.fidelmercadotech.com   -> Backend  (Laravel 12, Hostinger hPanel + SSH)
```

Convención de nombres: la demo usa el prefijo `demo-`. Cada despliegue para un
cliente real usa subdominios nombrados por el cliente
(`<cliente>-inventario-crm` / `<cliente>-inventario-crm-api`).

### Por qué el mismo dominio raíz es obligatorio

El login **no emite token**: `AuthController::login()` hace `Auth::login()` +
`session()->regenerate()` y el frontend (`frontend/src/lib/api.ts`) manda
`withCredentials: true` + `X-XSRF-TOKEN` leído de la cookie. Para que el
navegador acepte y reenvíe esa cookie de sesión sin fricción, frontend y API
deben ser **same-site**: dos subdominios de `fidelmercadotech.com` con
`SESSION_DOMAIN=.fidelmercadotech.com`.

Si el frontend quedara en `*.vercel.app` (cross-site), habría que poner
`SESSION_SAME_SITE=none` y aun así Safari/Firefox/Brave bloquean la cookie de
terceros → login roto de forma intermitente. **No hacerlo así.** El dominio
personalizado de Vercel apuntando a `demo-inventario-crm.fidelmercadotech.com`
es parte del diseño, no un extra.

Todo el tráfico es **HTTPS** (cookies `Secure`). Sin HTTPS el login no funciona.

---

## Acceso SSH

```bash
ssh -p 65002 -i ~/.ssh/hostinger_apirrhh u910322706@82.29.157.42
```

(Misma cuenta Hostinger y misma llave que el resto de proyectos del servidor.
La clave privada nunca sale de la máquina local.)

Rutas en el servidor:

```text
~/domains/fidelmercadotech.com/control-inventario-crm/        <- clon del repo
~/domains/fidelmercadotech.com/public_html/demo-inventario-crm-api  <- symlink -> ../control-inventario-crm/backend/public
```

## PHP 8.4 (importante en este servidor)

`backend/composer.json` fija `"php": "^8.4"` y `config.platform.php = 8.4`. El
servidor tiene:

| Uso | Binario | Versión |
| --- | --- | --- |
| PHP web por defecto del hosting | (LiteSpeed) | 8.2 — **insuficiente** |
| PHP 8.4 CLI | `/opt/alt/php84/usr/bin/php` | 8.4.19 |
| Composer | `/usr/local/bin/composer` | 2.9.x |

**Web:** el sitio `demo-inventario-crm-api` debe quedar en **PHP 8.4 desde
hPanel** (hPanel > el sitio > *Configuración PHP* > 8.4). Es la forma correcta:
la versión la fija el hosting, no un parche en el repo.

> Workaround temporal (solo si aún no se cambió en hPanel): una línea
> `AddHandler application/x-httpd-alt-php84___lsphp .php` al final de
> `backend/public/.htaccess`, protegida con
> `git update-index --skip-worktree backend/public/.htaccess` para que
> `git pull` no falle. **Al cambiar hPanel a 8.4, revertir**:
> `git update-index --no-skip-worktree backend/public/.htaccess && git checkout -- backend/public/.htaccess`.

**CLI:** `composer` y `artisan` **siempre** con el PHP 8.4 explícito. `php` a
secas en este servidor es 8.2 y revienta con el platform check.

```bash
PHP=/opt/alt/php84/usr/bin/php
$PHP /usr/local/bin/composer install --no-dev --optimize-autoloader --no-interaction
$PHP artisan migrate --force
```

---

## Despliegue inicial (ya hecho — referencia)

```bash
PHP=/opt/alt/php84/usr/bin/php
cd ~/domains/fidelmercadotech.com

# 1. Clonar
git clone --depth 1 https://github.com/fimercadog/control-inventario-crm.git control-inventario-crm
git -C control-inventario-crm config core.fileMode false        # ignora los chmod de shared hosting
echo 'error_log' >> control-inventario-crm/.git/info/exclude    # log de LiteSpeed, no versionar

# 2. Symlink del doc root (el subdominio de hPanel crea una carpeta con default.php)
cd public_html
rm -rf demo-inventario-crm-api
ln -s ../control-inventario-crm/backend/public demo-inventario-crm-api

# 3. Dependencias
cd ~/domains/fidelmercadotech.com/control-inventario-crm/backend
$PHP /usr/local/bin/composer install --no-dev --optimize-autoloader --no-interaction

# 4. .env (ver plantilla abajo), clave y base
#    crear backend/.env con el contenido de "Plantilla .env de producción"
touch database/database.sqlite
$PHP artisan key:generate --force
$PHP artisan migrate --force
$PHP artisan db:seed --force        # SOLO la primera vez: crea la empresa y los usuarios demo

# 5. Storage público + caches + permisos
$PHP artisan storage:link
$PHP artisan config:cache
$PHP artisan route:cache
chmod -R 775 storage bootstrap/cache
```

### Plantilla `.env` de producción

```env
APP_NAME="Control Inventario + CRM"
APP_ENV=production
APP_KEY=                         # lo llena `php artisan key:generate --force`
APP_DEBUG=false
APP_URL=https://demo-inventario-crm-api.fidelmercadotech.com
# Zona horaria de la clínica. Sin esto, la agenda muestra las citas corridas
# según la zona del navegador (ver Release Gate S12, hallazgo C1).
APP_TIMEZONE=America/Bogota

# Frontend (Vercel, dominio personalizado). Alimenta CORS y el link de
# "recuperar contraseña". CORS_EXTRA_ORIGINS solo si hay más de un origen.
FRONTEND_URL=https://demo-inventario-crm.fidelmercadotech.com
CORS_EXTRA_ORIGINS=

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=sqlite

# Auth Sanctum SPA (cookies). Frontend y API son subdominios de
# fidelmercadotech.com -> cookie compartida en el dominio raíz, same-site lax.
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=.fidelmercadotech.com
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SANCTUM_STATEFUL_DOMAINS=demo-inventario-crm.fidelmercadotech.com

CACHE_STORE=database
QUEUE_CONNECTION=sync
BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
BCRYPT_ROUNDS=12

# --- Correo real: OBLIGATORIO si el cliente usa "recuperar contraseña" ---
# Con MAIL_MAILER=log el enlace de reseteo se escribe al log y NUNCA llega al
# usuario. El flujo de reseteo (AuthController::forgotPassword/resetPassword y
# las pantallas /forgot-password + /reset-password) está implementado y
# testeado, pero SIN SMTP real NO es funcionalidad entregable — es un
# requisito de deploy. Con un proveedor tipo Brevo/Mailgun/SES:
MAIL_MAILER=smtp
MAIL_HOST=smtp.tu-proveedor.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_SCHEME=tls
MAIL_FROM_ADDRESS="no-responder@clinica-cliente.com"
MAIL_FROM_NAME="${APP_NAME}"
# Si el cliente NO va a usar reseteo de contraseña (los usuarios los crea el
# admin a mano), se puede dejar MAIL_MAILER=log y documentarlo con el cliente.
```

Si el frontend cambia de host: actualizar `FRONTEND_URL` **y**
`SANCTUM_STATEFUL_DOMAINS` (sin `https://`), luego `config:clear` +
`config:cache`. Si el nuevo host **no** es subdominio de `fidelmercadotech.com`,
además `SESSION_SAME_SITE=none` y quitar `SESSION_DOMAIN` — pero ver la
advertencia de cookies de terceros arriba.

### CORS

`backend/config/cors.php` ya está listo para este esquema y **no se edita por
despliegue**: `supports_credentials => true`, y `allowed_origins` se arma con
`FRONTEND_URL` + `CORS_EXTRA_ORIGINS`. No hay dominios de otros proyectos
hardcodeados. Cambiar de dominio = cambiar el `.env`, no este archivo.

### Frontend (Vercel)

- Importar el repo, **Root Directory = `frontend`**, framework Next.js, Node 22.x.
- Variables de entorno (`NEXT_PUBLIC_*` se **hornean en el build** — ponerlas
  antes del primer deploy y *Redeploy* si se cambian):

```env
NEXT_PUBLIC_API_URL=https://demo-inventario-crm-api.fidelmercadotech.com/api
NEXT_PUBLIC_SITE_URL=https://demo-inventario-crm.fidelmercadotech.com
NEXT_PUBLIC_DEMO_MODE=true
```

- En *Domains*, agregar `demo-inventario-crm.fidelmercadotech.com` y repuntar ese
  hostname (DNS) a Vercel si hoy resuelve a Hostinger.

---

## Actualizar el backend tras un cambio de código

```bash
ssh -p 65002 -i ~/.ssh/hostinger_apirrhh u910322706@82.29.157.42
PHP=/opt/alt/php84/usr/bin/php
cd ~/domains/fidelmercadotech.com/control-inventario-crm
git pull origin master
cd backend
$PHP /usr/local/bin/composer install --no-dev --optimize-autoloader --no-interaction  # solo si cambió composer.lock
$PHP artisan migrate --force        # solo si hay migraciones nuevas
$PHP artisan config:cache           # regenera con el .env actual
$PHP artisan route:cache            # rutas nuevas no aparecen sin esto (da 404)
```

Nunca `migrate:fresh` con datos reales: borra todo. Para pasar de SQLite a MySQL
más adelante, exportar filas antes de tocar `DB_CONNECTION`.

## Smoke tests (correr después de cada deploy)

```bash
API=https://demo-inventario-crm-api.fidelmercadotech.com
ORIGIN=https://demo-inventario-crm.fidelmercadotech.com

curl -s -o /dev/null -w 'up            %{http_code}\n' $API/up                              # 200
curl -s -o /dev/null -w 'catalog cats  %{http_code}\n' $API/api/public/catalog/categories  # 200
curl -s -o /dev/null -w 'catalog prods %{http_code}\n' $API/api/public/catalog/products    # 200
curl -s -w '\n%{http_code}\n' $API/api/products -H 'Accept: application/json'               # 401 {"message":"Unauthenticated."}
curl -s -D - -o /dev/null $API/up | grep -i x-powered-by                                    # PHP/8.4.x

# Cookie + login real (contra el origen del frontend)
curl -s -c /tmp/cj -D - -o /dev/null $API/sanctum/csrf-cookie -H "Origin: $ORIGIN" | grep -i set-cookie   # XSRF-TOKEN + *-session, domain=.fidelmercadotech.com; secure
XSRF=$(sed -n 's/.*XSRF-TOKEN\t\(.*\)/\1/p' /tmp/cj)
curl -s -b /tmp/cj -w '\n%{http_code}\n' -X POST $API/api/auth/login \
  -H "Origin: $ORIGIN" -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -H "X-XSRF-TOKEN: $(python -c 'import urllib.parse,sys;print(urllib.parse.unquote(sys.argv[1]))' "$XSRF")" \
  -d '{"email":"superadmin@vetdemo.co","password":"password"}'                       # 200 + user con roles/permisos
```

En el navegador, además: cargar el frontend, hacer login real, abrir un producto
del catálogo con imagen (que la imagen cargue desde
`…/storage/products/{companyId}/…`), y subir una imagen nueva desde
`/app/productos`.

## Checklist si el login falla

1. **500 en texto plano** (no JSON) → `NEXT_PUBLIC_API_URL` sin definir o sin
   *Redeploy* en Vercel: el rewrite de `next.config.ts` intenta pegarle a
   `127.0.0.1:8001`.
2. **Error CORS en consola** → el origen del frontend no coincide con
   `FRONTEND_URL` en el `.env` del servidor. Ajustar y `config:cache`.
3. **419 / CSRF token mismatch** → `SESSION_DOMAIN`, `SESSION_SECURE_COOKIE` o
   `SANCTUM_STATEFUL_DOMAINS` mal, **o** frontend y API no son same-site.
   Verificar que ambos son subdominios de `fidelmercadotech.com` sobre HTTPS.
4. **401 tras loguear** (la sesión no persiste) → la cookie `*-session` no se
   está guardando/reenviando: casi siempre `SESSION_SAME_SITE`/`Secure` o el
   navegador bloqueando cookie de terceros (frontend fuera del dominio raíz).
5. **500 con "requires a PHP version >= 8.4.0"** → el web del sitio quedó en PHP
   8.2. Cambiar a 8.4 en hPanel (o aplicar el workaround `AddHandler`).
6. **404 en un endpoint que sí existe en el repo** → faltó `git pull` en el
   servidor o `route:cache` con rutas viejas.

## Credenciales demo

Los usuarios sembrados (`superadmin@vetdemo.co` … `password`, ver
[demo-users.md](demo-users.md)) son **públicos de demostración**: está bien para
un entorno con datos ficticios y visible en internet. **No** reutilizar esa
contraseña —ni el seeder— cuando un despliegue empiece a tener datos reales de
un cliente: ahí se crean usuarios propios con contraseñas reales y se corre
`migrate --force` **sin** `db:seed`.
