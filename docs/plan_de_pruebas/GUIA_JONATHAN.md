# Guía completa de pruebas - Jonathan (TC46 a TC60)

Guía paso a paso para ejecutar, entender y documentar tus 15 casos.
Asume que **la app ya está corriendo** (postgres, backend en `:8080`, frontend en `:3000`).

---

## Índice

1. [Tus casos y qué significa cada uno](#1-tus-casos)
2. [Herramientas que vas a usar](#2-herramientas)
3. [Cuentas sembradas](#3-cuentas-sembradas)
4. [Ejecución caso por caso](#4-ejecucion-caso-por-caso)
5. [Pruebas de rendimiento con k6](#5-rendimiento-tc59-y-tc60)
6. [Cómo documentar resultados](#6-documentar-resultados)
7. [Checklist de entrega](#7-checklist-de-entrega)

---

## 1. Tus casos

Son 15, divididos en 3 grupos:

**Funcionales (9):** 46, 47, 48, 49, 50, 51, 52, 53, 54
**Seguridad (4):** 55, 56, 57, 58
**Rendimiento (2):** 59, 60

Cada caso debe quedar documentado con:
- ID, Tipo, Precondiciones
- Datos de entrada (válidos e inválidos cuando aplique)
- Pasos
- Resultado esperado vs obtenido
- Estado (Pasa / Falla)
- Evidencia (captura o export)

---

## 2. Herramientas

| Para qué | Herramienta |
|---|---|
| UI / redirecciones (TC46) | **Navegador** (modo incógnito) |
| API, validaciones, seguridad (TC47–TC58) | **Postman** con la colección `postman/Jonathan-TC46-58.postman_collection.json` |
| Inspección de headers (TC55) | Postman o `curl -I` |
| Decodificar JWT (TC58) | `jwt.io` o el script incluido en la colección |
| Carga / estrés (TC59–TC60) | **k6** (`sudo pacman -S k6` o `docker pull grafana/k6`) |

**Antes de empezar**: importa la colección en Postman (File → Import → selecciona el JSON).

---

## 3. Cuentas sembradas

El backend crea estos usuarios al arrancar (si la DB está vacía):

| Usuario | Password | Rol | Email |
|---|---|---|---|
| `admin` | `admin` | ADMIN | admin@mycompany.com |
| `user` | `user` | USER | user@mycompany.com |

Si en algún momento los modificas con PUT `/api/users/me` y necesitas volver al
estado original, detén el backend, borra el volumen de postgres
(`docker compose down -v`) y vuelve a levantar.

---

## 4. Ejecución caso por caso

> **Formato común para todos los casos:** cada uno usa los campos **ID, Tipo,
> Herramienta, Precondiciones, Datos de entrada, Pasos, Resultado esperado,
> Resultado obtenido, Estado, Evidencia**. Los tres últimos los completas al
> ejecutar.

### TC46 · Redirección a login sin sesión activa

- **Tipo:** Funcional (UI)
- **Herramienta:** Navegador en ventana privada.
- **Precondiciones:** Usuario no autenticado, sin token en `localStorage`.
- **Datos de entrada:** URLs `/userpage` y `/adminpage`.
- **Pasos:**
  1. Abrir ventana privada del navegador.
  2. Navegar a `http://localhost:3000/userpage`.
  3. Navegar a `http://localhost:3000/adminpage`.
- **Resultado esperado:** En ambos casos, redirección automática a `/login`
  (por `PrivateRoute`).
- **Resultado obtenido:** _[completar al ejecutar]_
- **Estado:** _[Pasa / Falla]_
- **Evidencia:** captura con URLs de entrada + formulario de login final.

---

### TC47 · Usuario regular solo ve sus pedidos

- **Tipo:** Funcional / Autorización
- **Herramienta:** Postman (colección `Jonathan-TC46-58.postman_collection.json`).
- **Precondiciones:**
  - Colección importada en Postman (`File → Import`, solo la primera vez).
  - SETUPs ejecutados (generan `userToken` y `adminToken`).
- **Datos de entrada:** `userToken` válido.
- **Pasos:**
  1. Abrir la colección **"Jonathan - TC46-58"** en la sidebar de Postman.
  2. Ejecutar los 3 requests que empiezan con **"SETUP -"** en orden.
  3. Ejecutar `TC47a - GET /api/users/me`.
  4. Ejecutar `TC47b - GET /api/orders`.
- **Resultado esperado:** TC47a → `200` con orders del propio usuario; TC47b → `403`.
- **Resultado obtenido:** _[completar]_
- **Estado:** _[Pasa / Falla]_
- **Evidencia:** capturas de ambas responses (status + body).

> Tip: puedes ejecutar toda la colección con **Runner → Run collection** (los SETUP corren primero automáticamente).

---

### TC48 · Datos guardados correctamente al crear pedido

- **Tipo:** Funcional
- **Herramienta:** Postman.
- **Precondiciones:** SETUPs ejecutados (`userToken` válido).
- **Datos de entrada:** body `{ "description": "Pedido TC48 - {{$timestamp}}" }`.
- **Pasos:**
  1. Ejecutar `TC48 - POST /api/orders`.
  2. Ejecutar `TC47a - GET /api/users/me` y verificar que el pedido aparece.
- **Resultado esperado:** Paso 1 → `201 Created` con `id`, `description`, `createdAt`.
  Paso 2 → el pedido aparece en la lista del usuario.
- **Resultado obtenido:** _[completar]_
- **Estado:** _[Pasa / Falla]_
- **Evidencia:** captura del POST y del GET posterior mostrando el pedido.

---

### TC49 · Editar perfil y verificar persistencia

- **Tipo:** Funcional
- **Herramienta:** Postman.
- **Precondiciones:** SETUPs ejecutados (`userToken` válido).
- **Datos de entrada:** body `{ "name": "User Editado", "email": "user@mycompany.com" }`.
- **Pasos:**
  1. Ejecutar `TC49a - PUT /api/users/me`.
  2. Ejecutar `TC49b - GET /api/users/me`.
- **Resultado esperado:** Ambos `200`. El `name` devuelto en el GET coincide
  con el enviado en el PUT.
- **Resultado obtenido:** _[completar]_
- **Estado:** _[Pasa / Falla]_
- **Evidencia:** captura del PUT y del GET con el nombre actualizado.

> Inválido complementario: PUT con body vacío `{}` → 400.

---

### TC50 · Formato correcto de respuestas JSON

- **Tipo:** Funcional / Contrato
- **Herramienta:** Postman.
- **Precondiciones:** SETUPs ejecutados (`userToken` válido).
- **Datos de entrada:** GET `/api/users/me`.
- **Pasos:**
  1. Ejecutar `TC50 - GET /api/users/me`.
  2. Pestaña **Headers**: confirmar `Content-Type: application/json`.
  3. Pestaña **Body**: confirmar que el JSON tiene `id`, `username`, `name`,
     `email`, `role`, `orders`.
- **Resultado esperado:** JSON válido con todos los campos de `UserDto`
  y header `Content-Type: application/json`.
- **Resultado obtenido:** _[completar]_
- **Estado:** _[Pasa / Falla]_
- **Evidencia:** capturas del body y del header.

---

### TC51 · Códigos HTTP correctos

- **Tipo:** Funcional / Contrato
- **Herramienta:** Postman (sub-casos `a` a `f`).
- **Precondiciones:** SETUPs ejecutados.
- **Datos de entrada:** matriz de combinaciones (ver tabla).
- **Pasos:** ejecutar cada sub-caso y registrar el código HTTP.

| Sub | Acción | Esperado |
|---|---|---|
| a | POST `/auth/authenticate` (credenciales válidas) | 200 |
| b | POST `/auth/signup` (datos nuevos) | 201 |
| c | POST `/auth/signup` (campos vacíos / email inválido) | 400 |
| d | GET `/api/users/me` (sin header `Authorization`) | 401 |
| e | GET `/api/users` (token user regular) | 403 |
| f | GET `/api/users/no_existe_xyz` (token admin) | 404 |

- **Resultado esperado:** cada sub-caso devuelve el código de la tabla.
- **Resultado obtenido:** _[completar por sub-caso]_
- **Estado:** _[Pasa / Falla]_
- **Evidencia:** captura con los 6 sub-casos (Runner) o individualmente.

---

### TC52 · Campos con espacios en blanco

- **Tipo:** Validación
- **Herramienta:** Postman.
- **Precondiciones:** Ninguna (endpoint público).
- **Datos de entrada:**
  - Inválido: `{ "username": "   ", "password": "   ", "name": "   ", "email": "valid@test.com" }`
  - Válido (complementario): datos con contenido real.
- **Pasos:**
  1. Ejecutar `TC52 - POST /auth/signup` con datos en blanco.
  2. (Opcional) Ejecutar `TC51b` con datos válidos.
- **Resultado esperado:** Inválido → `400 Bad Request` (`@NotBlank`). Válido → `201`.
- **Resultado obtenido:** _[completar]_
- **Estado:** _[Pasa / Falla]_
- **Evidencia:** captura del 400 con el mensaje de validación.

---

### TC53 · Actualizar perfil con email ya en uso

- **Tipo:** Funcional / Validación de unicidad
- **Herramienta:** Postman.
- **Precondiciones:**
  - SETUP "Crear segundo usuario" ejecutado (`secondUserToken` válido).
  - El email `user@mycompany.com` existe (seed del `DatabaseInitializer`).
- **Datos de entrada:** body `{ "name": "Other", "email": "user@mycompany.com" }`
  con header `Authorization: Bearer {{secondUserToken}}`.
- **Pasos:** ejecutar `TC53 - PUT /api/users/me`.
- **Resultado esperado:** `400 Bad Request` con mensaje que incluye la palabra "email".
- **Resultado obtenido:** _[completar]_
- **Estado:** _[Pasa / Falla]_
- **Evidencia:** captura del 400 + body del error.

---

### TC54 · Actualizar perfil con datos válidos

- **Tipo:** Funcional
- **Herramienta:** Postman.
- **Precondiciones:** SETUP "Crear segundo usuario" ejecutado.
- **Datos de entrada:** body `{ "name": "Other Editado", "email": "{{secondUserEmail}}" }`.
- **Pasos:** ejecutar `TC54 - PUT /api/users/me`.
- **Resultado esperado:** `200` y `name` igual a "Other Editado" en la respuesta.
- **Resultado obtenido:** _[completar]_
- **Estado:** _[Pasa / Falla]_
- **Evidencia:** captura del 200 + body con el nombre nuevo.

---

### TC55 · Headers de seguridad HTTP

- **Tipo:** Seguridad
- **Herramienta:** Postman o `curl -I http://localhost:8080/public/numberOfUsers`.
- **Precondiciones:** Backend corriendo.
- **Datos de entrada:** GET a cualquier endpoint público.
- **Pasos:**
  1. Ejecutar `TC55 - GET /public/numberOfUsers` (o `curl -I ...`).
  2. Revisar headers de la respuesta.
- **Resultado esperado:** presentes al menos `X-Content-Type-Options: nosniff`,
  `X-Frame-Options`, `Cache-Control`. Recomendado: `Strict-Transport-Security`
  (en HTTPS), `Content-Security-Policy`.
- **Resultado obtenido:** _[listar headers encontrados y los ausentes]_
- **Estado:** _[Pasa / Falla]_ — si faltan headers, documéntalo como hallazgo
  de seguridad con recomendación.
- **Evidencia:** captura de la pestaña Headers de Postman o salida de `curl -I`.

---

### TC56 · Métodos HTTP no permitidos

- **Tipo:** Seguridad / Contrato
- **Herramienta:** Postman.
- **Precondiciones:** Backend corriendo.
- **Datos de entrada:**
  - `TC56a`: PUT a `/auth/authenticate`.
  - `TC56b`: DELETE a `/public/numberOfUsers`.
- **Pasos:** ejecutar `TC56a` y `TC56b`.
- **Resultado esperado:** ambos responden `405 Method Not Allowed`.
- **Resultado obtenido:** _[completar]_
- **Estado:** _[Pasa / Falla]_
- **Evidencia:** capturas de los dos responses con status 405.

---

### TC57 · Datos sensibles no expuestos en errores

- **Tipo:** Seguridad
- **Herramienta:** Postman.
- **Precondiciones:** SETUPs ejecutados (`adminToken` válido).
- **Datos de entrada:** GET `/api/users/no_existe_xyz` con token admin.
- **Pasos:**
  1. Ejecutar `TC57 - GET /api/users/no_existe_xyz`.
  2. Inspeccionar body de la respuesta.
- **Resultado esperado:** el body NO contiene:
  - palabra `exception` / stacktrace
  - fragmentos SQL (`select `, `from `)
  - palabra `password`
  - paquetes Java (`com.ivanfranchin.*`)
- **Resultado obtenido:** _[listar contenido del body]_
- **Estado:** _[Pasa / Falla]_ — si alguno aparece, es hallazgo de seguridad.
- **Evidencia:** captura del body completo del 404.

---

### TC58 · No se puede registrar admin desde API pública

- **Tipo:** Seguridad / Autorización
- **Herramienta:** Postman.
- **Precondiciones:** Backend corriendo.
- **Datos de entrada:** body con `"role": "ADMIN"` en el payload del signup.
- **Pasos:**
  1. Ejecutar `TC58 - POST /auth/signup` con `role: "ADMIN"`.
  2. Copiar el `accessToken` devuelto.
  3. Decodificarlo en https://jwt.io (o en el assert que ya viene en la colección).
- **Resultado esperado:** Signup `201`; el JWT tiene rol `USER`, no `ADMIN`
  (el campo del body es ignorado por el backend).
- **Resultado obtenido:** _[completar con el rol decodificado]_
- **Estado:** _[Pasa / Falla]_
- **Evidencia:** captura del response + payload JWT decodificado.

---

## 5. Rendimiento (TC59 y TC60)

### TC59 · Carga: 50 usuarios concurrentes

- **Tipo:** Rendimiento / Carga
- **Herramienta:** k6 (nativo o en Docker).
- **Precondiciones:**
  - Backend corriendo en `:8080`.
  - Usuario `user/user` existe (seed).
  - Script `postman/tc59-load.js` creado (ver abajo).
- **Datos de entrada:** 50 VUs (usuarios virtuales) durante 1 minuto; cada VU
  hace login + GET `/api/users/me`.
- **Pasos:**
  1. Crear el archivo `postman/tc59-load.js` con el contenido de abajo.
  2. Ejecutar `k6 run postman/tc59-load.js`.
  3. Anotar `avg`, `p95`, `max` de `http_req_duration` y `http_req_failed`.
- **Resultado esperado:** `p95 < 1000ms` y `http_req_failed < 1%`
  (thresholds ya configurados en el script).
- **Resultado obtenido:** _[pegar métricas del resumen]_
- **Estado:** _[Pasa / Falla]_
- **Evidencia:** output completo del terminal (bloque "summary" de k6).

Archivo `postman/tc59-load.js`:

```js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed:   ['rate<0.01'],
  },
};

export default function () {
  const login = http.post(
    'http://localhost:8080/auth/authenticate',
    JSON.stringify({ username: 'user', password: 'user' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(login, { 'login 200': r => r.status === 200 });

  const token = login.json('accessToken');
  const me = http.get('http://localhost:8080/api/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  check(me, { '/me 200': r => r.status === 200 });

  sleep(1);
}
```

Ejecutar:
```bash
k6 run postman/tc59-load.js
# o:
docker run --rm -i --network host grafana/k6 run - < postman/tc59-load.js
```

**Qué reportar del resultado:** `avg`, `p95`, `max` de `http_req_duration`, y
`http_req_failed`. Guarda el output de la terminal como evidencia.

### TC60 · Estrés: pedidos en ráfaga

- **Tipo:** Rendimiento / Estrés
- **Herramienta:** k6.
- **Precondiciones:**
  - Backend corriendo en `:8080`.
  - Usuario `user/user` existe.
  - Script `postman/tc60-stress.js` creado (ver abajo).
- **Datos de entrada:** ramp-up 0 → 50 → 100 → 200 VUs (2 minutos total)
  haciendo POST `/api/orders`.
- **Pasos:**
  1. Crear el archivo `postman/tc60-stress.js`.
  2. Ejecutar `k6 run postman/tc60-stress.js`.
  3. Observar a partir de qué etapa crece `http_req_failed` o `p95` se dispara.
- **Resultado esperado:** Identificar el punto de quiebre. No existe un número
  fijo "aprobado"; la evidencia válida es documentar a qué carga falla el sistema.
- **Resultado obtenido:** _[describir comportamiento por etapa]_
- **Estado:** _[Pasa / Falla / Informativo]_
- **Evidencia:** output completo del terminal y, si usas `k6 --out`, el CSV.

Archivo `postman/tc60-stress.js`:

```js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 0 },
  ],
};

export function setup() {
  const r = http.post(
    'http://localhost:8080/auth/authenticate',
    JSON.stringify({ username: 'user', password: 'user' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  return { token: r.json('accessToken') };
}

export default function (data) {
  const res = http.post(
    'http://localhost:8080/api/orders',
    JSON.stringify({ description: `stress-${Date.now()}-${__VU}-${__ITER}` }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.token}`,
      },
    }
  );
  check(res, { 'create order 201': r => r.status === 201 });
}
```

Ejecutar igual. **Qué buscar:** la etapa donde `http_req_failed` crece o `p95` se
dispara. Ese es tu punto de quiebre → inclúyelo en el informe.

---

## 6. Documentar resultados

Crea `docs/plan_de_pruebas/resultados_jonathan.md` usando esta plantilla por caso:

```markdown
## TC46 - Redirección a login sin sesión activa
- **Tipo:** Funcional
- **Precondiciones:** Usuario no autenticado
- **Datos de entrada:** URL /userpage
- **Pasos:**
  1. Abrir navegador en modo privado
  2. Navegar a http://localhost:3000/userpage
- **Resultado esperado:** Redirección automática a /login
- **Resultado obtenido:** Redirigido a /login correctamente
- **Estado:** Pasa
- **Evidencia:** capturas/tc46.png
```

Para casos automáticos (Postman), puedes exportar el resultado del Runner como
evidencia: **Runner → Run → botón Export Results**.

Para k6, pega el resumen final (la tabla con métricas) en el documento.

---

## 7. Checklist de entrega

- [ ] Colección Postman importada y los SETUP corren antes que los casos.
- [ ] TC46 probado en navegador (captura guardada).
- [ ] TC47–TC58 ejecutados con Postman Runner (export guardado).
- [ ] TC59 y TC60 ejecutados con k6 (summary guardado).
- [ ] Cada caso tiene entrada en `resultados_jonathan.md`.
- [ ] Hallazgos de seguridad (si los hay) incluyen recomendación.
- [ ] Mencionas versiones (Spring Boot, Java 21, k6, Postman).

---

## 8. Tips rápidos

- **Postman:** pestaña **Tests** de cada request tiene los `pm.test(...)`. Léelos
  para entender qué se está validando.
- **Si un caso "falla" como seguridad (ej. TC55):** no lo ocultes, documéntalo
  como hallazgo. Ese es el valor real del testing.
- **Cambia datos a propósito:** en TC51c borra solo 1 campo, luego 2, etc. Verás
  cómo responde la validación.
- **Para TC58, si quieres ser exhaustivo:** intenta también `"rol": "ADMIN"` o
  `"authorities": ["ADMIN"]` en el body. Todo debe ignorarse.
- **Siempre compara con lo esperado**, no con "lo que salió". Si salió algo
  distinto a lo esperado, eso es un hallazgo, no una mala ejecución.

---

## 9. Troubleshooting

| Problema | Causa | Solución |
|---|---|---|
| Postman 401 en todos lados | Variables `userToken` vacías | Corre primero los 3 SETUPs |
| TC53 devuelve 200 | Email del target no existe | Revisa `DatabaseInitializer.java`, usa `user@mycompany.com` |
| TC55 fallan varios headers | Normal en dev | Documéntalo como hallazgo |
| k6 `connection refused` | Backend saturado o caído | Bajar VUs; revisar logs backend |
| TC60 muchos 400 | IDs de orden duplicados | El script ya usa timestamp+VU+ITER; si sigue fallando, revisa logs |
