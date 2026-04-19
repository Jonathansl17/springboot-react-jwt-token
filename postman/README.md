# Guía de pruebas - Jonathan (TC46 a TC60)

Esta guía te lleva paso a paso para ejecutar y documentar tus 15 casos de prueba del
plan de pruebas. Está pensada para aprender, no solo para pasar los casos.

---

## 1. Objetivo

Probar la aplicación **order-api + order-ui** en tres dimensiones:

1. **Funcionales / Validaciones** (TC46–TC54): que el sistema haga lo que debe hacer.
2. **Seguridad** (TC55–TC58): que no exponga información ni permita accesos indebidos.
3. **Rendimiento** (TC59–TC60): que aguante carga.

Al terminar vas a tener:

- Evidencias automáticas (Postman) para TC46–TC58.
- Scripts de carga (k6) para TC59–TC60.
- Un documento con resultados por caso.

---

## 2. Conceptos básicos (5 min de teoría)

### 2.1 Tipos de prueba que vas a usar

| Tipo | Qué verifica | Herramienta |
|---|---|---|
| Funcional | Que una acción produzca el resultado esperado | Postman + navegador |
| Validación | Que inputs inválidos se rechacen | Postman |
| Seguridad | Que no haya fuga de información ni bypass de autorización | Postman + `curl` |
| Carga (load) | Comportamiento con usuarios concurrentes normales | k6 |
| Estrés (stress) | Comportamiento en el límite hasta que falla | k6 |

### 2.2 Códigos HTTP que vas a encontrar

| Código | Significado | Cuándo |
|---|---|---|
| 200 | OK | Operación exitosa que devuelve datos |
| 201 | Created | Recurso creado (signup, POST /api/orders) |
| 400 | Bad Request | Body inválido, validación fallida |
| 401 | Unauthorized | Sin token o token inválido |
| 403 | Forbidden | Autenticado pero sin permisos |
| 404 | Not Found | Recurso no existe |
| 405 | Method Not Allowed | Método HTTP no soportado en esa ruta |

### 2.3 Estructura de un caso de prueba (formato recomendado)

```
ID: TC-046
Nombre: Redirección a login sin sesión activa
Tipo: Funcional
Precondiciones: Usuario NO autenticado
Datos de entrada: URL /userpage
Pasos:
  1. Abrir navegador en ventana privada
  2. Navegar a http://localhost:3000/userpage
Resultado esperado: Redirección automática a /login
Resultado obtenido: [completar al ejecutar]
Estado: [Pasa / Falla]
Evidencia: capturas/tc46.png
```

Cada caso debe incluir un **valor válido y uno inválido** cuando aplique.

---

## 3. Preparación del entorno

### 3.1 Levantar la aplicación

Abre **tres terminales** (o pestañas):

**Terminal 1 - Postgres:**
```bash
cd ~/springboot-react-jwt-token
docker compose up
```

**Terminal 2 - Backend:**
```bash
cd ~/springboot-react-jwt-token/order-api
./mvnw spring-boot:run
```
Queda escuchando en `http://localhost:8080`.

**Terminal 3 - Frontend:**
```bash
cd ~/springboot-react-jwt-token/order-ui
pnpm start
```
Queda escuchando en `http://localhost:3000`.

### 3.2 Usuarios sembrados

El `DatabaseInitializer` crea automáticamente:

| Usuario | Password | Rol | Email |
|---|---|---|---|
| `admin` | `admin` | ADMIN | admin@mycompany.com |
| `user` | `user` | USER | user@mycompany.com |

### 3.3 Instalar herramientas

- **Postman** (GUI): https://www.postman.com/downloads/
- **k6** (carga):
  ```bash
  # Opción Docker (sin instalar nada):
  docker pull grafana/k6
  # Opción nativa Arch:
  sudo pacman -S k6
  ```

---

## 4. Ejecutar TC46–TC58 con Postman

### 4.1 Importar la colección

1. Abre Postman → `File → Import`.
2. Selecciona `postman/TC46-58 Validaciones y Seguridad.postman_collection.json`.
3. En el panel izquierdo aparece **"TC46-58 Validaciones y Seguridad"**.

### 4.2 Ejecutar toda la colección

1. Click derecho sobre la colección → **"Run collection"**.
2. Asegúrate de que el orden sea el del archivo (SETUPs primero).
3. Click **"Run"**.
4. Postman ejecuta todo y muestra pass/fail por cada `pm.test(...)`.
5. Exporta el resultado: botón **"Export Results"** → guarda como `.json` o capturas.

### 4.3 Ejecutar un caso individual

Selecciona la petición en la sidebar → **"Send"** → pestaña **"Test Results"**
te dice qué asserts pasaron.

### 4.4 Qué cubre cada caso

| TC | Cómo se prueba en la colección | Assert clave |
|---|---|---|
| 46 | **Manual en navegador** (Postman no corre el SPA) | Redirige a `/login` |
| 47a | GET `/api/users/me` con token user | 200, orders array |
| 47b | GET `/api/orders` con token user | 403 |
| 48 | POST `/api/orders` con user | 201, respuesta tiene `id`, `description`, `createdAt` |
| 49a | PUT `/api/users/me` | 200, `name` cambió |
| 49b | GET `/api/users/me` después | persistió el cambio |
| 50 | GET `/api/users/me` | `Content-Type: application/json` + estructura completa |
| 51a–f | login, signup, body vacío, sin token, rol bajo, recurso inexistente | 200/201/400/401/403/404 |
| 52 | signup con `"   "` en campos | 400 por `@NotBlank` |
| 53 | PUT `/api/users/me` con email de otro usuario | 400 + mensaje menciona "email" |
| 54 | PUT `/api/users/me` con datos válidos | 200 |
| 55 | GET `/public/numberOfUsers` + inspección headers | `X-Content-Type-Options`, etc. |
| 56a | PUT `/auth/authenticate` | 405 |
| 56b | DELETE `/public/numberOfUsers` | 405 |
| 57 | GET `/api/users/no_existe_xyz` | el body no contiene `exception`, `select`, `password`, paquetes Java |
| 58 | signup con `"role": "ADMIN"` en el body | el JWT resultante tiene rol USER, no ADMIN |

### 4.5 Qué hacer si un caso falla

**No todo "falla" es bug tuyo** — es justamente lo que estás buscando.
Documenta:
1. Request enviado (método, URL, headers, body).
2. Response recibido (status, headers, body).
3. Resultado esperado vs obtenido.
4. Hipótesis de por qué falla.

Por ejemplo, si TC55 falla porque faltan headers de seguridad, eso es un **hallazgo
de seguridad real** que va al informe.

---

## 5. TC59 y TC60 con k6 (rendimiento)

### 5.1 Preparar script de carga (TC59 — 50 usuarios concurrentes)

Crea `postman/tc59-load.js`:

```js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,            // 50 usuarios virtuales
  duration: '1m',     // durante 1 minuto
  thresholds: {
    http_req_duration: ['p(95)<1000'], // el 95% de requests < 1s
    http_req_failed:   ['rate<0.01'],  // <1% de errores
  },
};

export default function () {
  const login = http.post(
    'http://localhost:8080/auth/authenticate',
    JSON.stringify({ username: 'user', password: 'user' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(login, { 'login 200': (r) => r.status === 200 });

  const token = login.json('accessToken');
  const me = http.get('http://localhost:8080/api/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  check(me, { '/me 200': (r) => r.status === 200 });

  sleep(1);
}
```

Ejecuta:
```bash
k6 run postman/tc59-load.js
# o con docker:
docker run --rm -i --network host grafana/k6 run - < postman/tc59-load.js
```

**Qué mirar en el resultado:**
- `http_req_duration` → avg, p95, max.
- `http_req_failed` → porcentaje de fallos.
- `checks` → ratio de asserts que pasaron.
- Si uno de los `thresholds` falla, k6 sale con código distinto de 0 → evidencia objetiva.

### 5.2 Script de estrés (TC60 — ramp-up hasta 200 VUs)

Crea `postman/tc60-stress.js`:

```js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // sube a 50
    { duration: '30s', target: 100 },  // sube a 100
    { duration: '30s', target: 200 },  // sube a 200
    { duration: '30s', target: 0 },    // baja
  ],
};

// Token precalculado para no gastar tiempo autenticándose en cada iteración
let token = '';
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
  check(res, { 'create order 201': (r) => r.status === 201 });
}
```

Ejecuta igual que TC59 y **busca el punto de quiebre**: la etapa donde
`http_req_failed` empieza a crecer o `p95` se dispara.

---

## 6. Documentar los resultados

Crea `docs/plan_de_pruebas/resultados_jonathan.md` con una tabla por cada caso:

```markdown
## TC46 - Redirección a login sin sesión activa
- Tipo: Funcional
- Resultado: Pasa
- Evidencia: capturas/tc46.png
- Observaciones: Probado en Firefox 120, navegación privada.

## TC47 - Usuario regular solo ve sus pedidos
- Tipo: Funcional
- Resultado: Pasa
- Evidencia: postman-run-tc47.png
- Observaciones: TC47a 200 OK, TC47b 403 como se esperaba.

## TC55 - Headers de seguridad
- Tipo: Seguridad
- Resultado: Falla (parcial)
- Evidencia: capturas/tc55-headers.png
- Hallazgo: falta `Strict-Transport-Security` y `Content-Security-Policy`.
- Recomendación: configurar `HeadersConfigurer` en SecurityConfig.
```

---

## 7. Tips de aprendizaje

1. **Lee cada request antes de enviarlo.** Entiende método, URL, headers y body.
2. **Revisa la pestaña Tests en Postman** — ahí ves cómo los asserts (`pm.test`)
   validan la respuesta. Cuando entiendas eso, ya sabes QA automatizado básico.
3. **Cambia los datos a propósito** para ver qué pasa (ej. en TC51c borra
   todos los campos, agrega uno, etc.). Exploración = aprender.
4. **En los casos de seguridad piensa como atacante**: ¿qué pasaría si...?
   Esa mentalidad es el 80% del testing de seguridad.
5. **En rendimiento no busques un número mágico.** Busca *tendencias*:
   a qué carga empieza a degradarse.

---

## 8. Checklist final antes de entregar

- [ ] Los 15 casos tienen evidencia (captura, export de Postman, salida de k6).
- [ ] Cada caso dice claramente si pasa o falla.
- [ ] Los hallazgos de seguridad tienen recomendación concreta.
- [ ] La sección de rendimiento tiene al menos `p95`, `avg`, `failed rate`.
- [ ] El documento de resultados está en `docs/plan_de_pruebas/`.
- [ ] Mencionas versiones: backend Spring Boot, Java, k6, Postman usados.

---

## 9. Troubleshooting rápido

| Problema | Causa probable | Solución |
|---|---|---|
| `ERR_CONNECTION_REFUSED` en el front | Backend no corriendo | Levantar `./mvnw spring-boot:run` |
| `401` en todas las requests del Runner | Variables `userToken`/`adminToken` vacías | Los SETUP no corrieron primero. Reordena |
| TC53 devuelve 200 en vez de 400 | No está usando el email de `admin` | Revisa que `user@mycompany.com` exista |
| k6: `dial tcp: connect: connection refused` | Backend no acepta la carga o no está arriba | Bajar VUs o revisar backend |
| TC55 muchos headers faltantes | Normal en dev. Documentarlo como hallazgo | No es un bloqueador de tu prueba |

---

## 10. Referencias

- Postman - Scripts: https://learning.postman.com/docs/tests-and-scripts/
- k6 docs: https://k6.io/docs/
- HTTP status codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- OWASP Secure Headers: https://owasp.org/www-project-secure-headers/
