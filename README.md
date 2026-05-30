# Guía de pruebas - Jonathan (TC46 a TC60)

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
2. Selecciona `tc46-58/TC46-58 Validaciones y Seguridad.postman_collection.json`.
3. En el panel izquierdo aparece **"TC46-58 Validaciones y Seguridad"**.

### 4.2 Ejecutar toda la colección

1. Click derecho sobre la colección → **"Run collection"**.
2. Asegúrate de que el orden sea el del archivo (SETUPs primero).
3. Click **"Run"**.
4. Postman ejecuta todo y muestra pass/fail por cada `pm.test(...)`.
5. Exporta el resultado: botón **"Export Results"** → guarda como `.json` o capturas.



## 5. TC59 y TC60 con k6 (rendimiento)

### 5.1 TC59 — 50 usuarios concurrentes

```bash
k6 run tc46-58/tc59-load.js
# o con docker:
docker run --rm -i --network host grafana/k6 run - < tc46-58/tc59-load.js
```


### 5.2 TC60 — subida gradual hasta 200 usuarios simultáneos

```bash
k6 run tc46-58/tc60-stress.js
# o con docker:
docker run --rm -i --network host grafana/k6 run - < tc46-58/tc60-stress.js
```


---



