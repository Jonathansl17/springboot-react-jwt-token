# Guía de pruebas

## 1. Preparar el entorno

Abre **tres terminales** o pestañas:

### 1.1 Terminal 1 - Postgres

```bash
cd ~/springboot-react-jwt-token
docker compose up
```

### 1.2 Terminal 2 - Backend

```bash
cd ~/springboot-react-jwt-token/order-api
./mvnw spring-boot:run
```

Queda escuchando en `http://localhost:8080`.

### 1.3 Terminal 3 - Frontend

```bash
cd ~/springboot-react-jwt-token/order-ui
pnpm start
```

Queda escuchando en `http://localhost:3000`.

---

## 2. Usuarios sembrados

El `DatabaseInitializer` crea automáticamente:

| Usuario | Password | Rol   | Email                                             |
| ------- | -------- | ----- | ------------------------------------------------- |
| `admin` | `admin`  | ADMIN | [admin@mycompany.com](mailto:admin@mycompany.com) |
| `user`  | `user`   | USER  | [user@mycompany.com](mailto:user@mycompany.com)   |

---

## 3. Instalar herramientas

### 3.1 Postman

- **Postman** GUI: https://www.postman.com/downloads/

### 3.2 k6

```bash
# Opción Docker, sin instalar nada:
docker pull grafana/k6

# Opción nativa Arch:
sudo pacman -S k6
```

---

## 4. Ejecutar TC1–TC13 con Postman

### 4.1 Importar la colección

1. Abre Postman.
2. Ve a `File → Import`.
3. Selecciona `tc1-15/TC1-13.postman_collection.json`.

### 4.2 Ejecutar la colección

1. En el panel izquierdo selecciona la colección importada.
2. Haz click derecho sobre la colección.
3. Selecciona **"Run collection"**.
4. Haz click en **"Run"**.
5. Revisa los resultados de las pruebas.

---

## 5. Ejecutar TC14 y TC15 con k6

### 5.1 TC14 - Rendimiento

```bash
k6 run tc1-15/tc14-registro.js
```

O con Docker:

```bash
docker run --rm -i --network host grafana/k6 run - < tc1-15/tc14-registro.js
```

> **Nota:** Simula 30 usuarios durante 30 segundos realizando registros en `POST /auth/signup`.

### 5.2 TC15 - Rendimiento

```bash
k6 run tc1-15/tc15-login.js
```

O con Docker:

```bash
docker run --rm -i --network host grafana/k6 run - < tc1-15/tc15-login.js
```

> **Nota:** Simula 30 usuarios durante 30 segundos realizando login en `POST /auth/authenticate`.

---

## 6. Ejecutar TC16–TC28 con Postman y TC29–TC30 con k6

### 6.1 Importar la colección

1. Abre Postman.
2. Ve a `File → Import`.
3. Selecciona `tc16-30/TC16-30 Pedidos Dereck.postman_collection.json`.

### 6.2 Ejecutar la colección

1. En el panel izquierdo selecciona la colección importada.
2. Haz click derecho sobre la colección.
3. Selecciona **"Run collection"**.
4. Haz click en **"Run"**.
5. Revisa los resultados de las pruebas.

### 6.3 TC29 - Rendimiento con pocos pedidos

```bash
k6 run tc16-30/tc29-listar-pedidos-pocos.js
```

O con Docker:

```bash
docker run --rm -i --network host grafana/k6 run - < tc16-30/tc29-listar-pedidos-pocos.js
```

> **Nota:** Simula 1 usuario realizando 10 iteraciones de `GET /api/users/me` con ~15 pedidos. Umbral: p95 < 1000 ms.

### 6.4 TC30 - Rendimiento con muchos pedidos

```bash
k6 run tc16-30/tc30-listar-pedidos-muchos.js
```

O con Docker:

```bash
docker run --rm -i --network host grafana/k6 run - < tc16-30/tc30-listar-pedidos-muchos.js
```

> **Nota:** Simula 1 usuario realizando 10 iteraciones de `GET /api/users/me` con ~100 pedidos. Umbral: p95 < 1000 ms.

---

## 7. Ejecutar TC39–TC43 con Postman

### 7.1 Importar las colecciones

1. Abre Postman.
2. Ve a `File → Import`.
3. Selecciona `tc39-43/TC-39.postman_collection.json`.
4. Repite el proceso con `tc39-43/TC-43.postman_collection.json`.

### 7.2 Ejecutar todas las colecciones

1. Asegúrate de tener al menos un pedido creado en el sistema antes de correr.
2. En el panel izquierdo selecciona la colección **TC-39**.
3. Haz click derecho sobre la colección.
4. Selecciona **"Run collection"**.
5. Haz click en **"Run"**.
6. Cuando termine, repite con la colección **TC-43**.

---

## 8. Ejecutar TC45 con k6

### 8.1 TC45 - Rendimiento

```bash
k6 run tc39-43/tc45-load.js
```

O con Docker:

```bash
docker run --rm -i --network host grafana/k6 run - < tc39-43/tc45-load.js
```

> **Nota:** Esta prueba simula 50 usuarios virtuales creando pedidos simultáneamente durante 1 minuto.

---

## 9. Ejecutar TC46–TC58 con Postman

### 9.1 Importar la colección

1. Abre Postman.
2. Ve a `File → Import`.
3. Selecciona `tc46-58/TC46-58 Validaciones y Seguridad.postman_collection.json`.
4. En el panel izquierdo aparece **"TC46-58 Validaciones y Seguridad"**.

### 9.2 Ejecutar toda la colección

1. Haz click derecho sobre la colección.
2. Selecciona **"Run collection"**.
3. Asegúrate de que el orden sea el del archivo, con los SETUPs primero.
4. Haz click en **"Run"**.
5. Postman ejecuta todo y muestra pass/fail por cada `pm.test(...)`.
6. Exporta el resultado con **"Export Results"**.
7. Guarda el resultado como `.json` o toma capturas.

---

## 10. Ejecutar TC59 y TC60 con k6

### 10.1 TC59 - 50 usuarios concurrentes

```bash
k6 run tc46-58/tc59-load.js
```

O con Docker:

```bash
docker run --rm -i --network host grafana/k6 run - < tc46-58/tc59-load.js
```

### 10.2 TC60 - Subida gradual hasta 200 usuarios simultáneos

```bash
k6 run tc46-58/tc60-stress.js
```

O con Docker:

```bash
docker run --rm -i --network host grafana/k6 run - < tc46-58/tc60-stress.js
```
