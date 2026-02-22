# Apuntes de Análisis del Proyecto - Spring Boot + React + JWT

> Análisis de seguridad, bugs, ineficiencias y malas prácticas encontradas en el proyecto.
> Fecha: 2026-02-22

---

## RESUMEN DE SEVERIDADES

| Nivel | Cantidad |
|-------|----------|
| CRÍTICO | 5 |
| ALTO | 18 |
| MEDIO | 12 |
| BAJO | 8 |
| **Total** | **43** |

---

## 1. VULNERABILIDADES CRÍTICAS

### 1.1 Credenciales de BD Hardcodeadas
**Archivo:** `order-api/src/main/resources/application.yml` (líneas 7-10)
```yaml
username: postgres
password: postgres
```
- Credenciales expuestas en el repositorio.
- Cualquier persona con acceso al repo puede conectarse a la BD.
- **Fix:** Usar variables de entorno: `${DB_PASSWORD}` o perfiles Spring por ambiente.

---

### 1.2 Secreto JWT Público en el Repositorio
**Archivo:** `order-api/src/main/resources/application.yml` (línea 16)
```yaml
app.jwt.secret: v9y$B&E)H@MbQeThWmZq4t7w!...
```
- La clave para firmar/verificar JWTs está hardcodeada y en el repo.
- Un atacante puede forjar tokens válidos para cualquier usuario.
- **Fix:** Cargar desde variable de entorno: `${JWT_SECRET}`. Considerar RSA (HS512 → RS256).

---

### 1.3 Credenciales de Docker Triviales
**Archivo:** `docker-compose.yml` (líneas 8-11)
```yaml
POSTGRES_PASSWORD=postgres
POSTGRES_USER=postgres
```
- Usuario y contraseña iguales y triviales, expuestos en el repo.
- **Fix:** Usar archivo `.env` (añadido a `.gitignore`) y referenciar con `${VAR}`.

---

### 1.4 Credenciales de Prueba Inicializadas en Producción
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/runner/DatabaseInitializer.java` (líneas 35-38)
```java
new User("admin", "admin", ...),
new User("user", "user", ...)
```
- Se crean usuarios `admin/admin` y `user/user` en CADA arranque, incluyendo producción.
- **Fix:** Añadir `@Profile("dev")` a la clase para que solo corra en desarrollo.

---

### 1.5 `ddl-auto: create` — Borra la BD en Cada Reinicio
**Archivo:** `order-api/src/main/resources/application.yml` (líneas 5-6)
```yaml
spring.jpa.hibernate.ddl-auto: create
```
- `create` elimina y recrea todas las tablas en cada reinicio.
- En producción esto significa **pérdida total de datos**.
- **Fix:** Cambiar a `validate` (producción) o `update` (desarrollo con datos persistentes).

---

## 2. VULNERABILIDADES ALTAS

### 2.1 Token JWT Almacenado en localStorage
**Archivo:** `order-ui/src/components/context/AuthContext.js` (líneas 9, 14, 18)
```javascript
localStorage.setItem('user', JSON.stringify(user))
```
- localStorage es accesible por JavaScript, por lo que un ataque XSS puede robar el token.
- **Fix:** Usar cookies con flags `httpOnly`, `Secure`, `SameSite=Strict`.

---

### 2.2 CSRF Deshabilitado Globalmente
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/security/SecurityConfig.java` (línea 44)
```java
.csrf(AbstractHttpConfigurer::disable)
```
- Todos los endpoints de modificación (POST, DELETE, etc.) son vulnerables a CSRF.
- **Fix:**
  ```java
  .csrf(csrf -> csrf
      .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
      .ignoringRequestMatchers("/auth/**"))
  ```

---

### 2.3 CORS Demasiado Permisivo
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/security/CorsConfig.java` (líneas 20-21)
```java
configuration.addAllowedMethod("*");
configuration.addAllowedHeader("*");
```
- Se permiten todos los métodos y headers desde los orígenes configurados.
- **Fix:** Especificar solo los métodos y headers necesarios:
  ```java
  configuration.setAllowedMethods(Arrays.asList("GET", "POST", "DELETE"));
  configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
  ```

---

### 2.4 Sin Rate Limiting en Endpoints de Autenticación
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/rest/AuthController.java` (líneas 34-54)
- `/auth/authenticate` y `/auth/signup` no tienen límite de intentos.
- Vulnerable a fuerza bruta y enumeración de usuarios.
- **Fix:** Implementar `bucket4j` o Spring Security's rate limiting. Bloquear IP tras N fallos.

---

### 2.5 Validación de Expiración de Token Hecha en el Cliente
**Archivo:** `order-ui/src/components/misc/OrderApi.js` (líneas 85-92)
```javascript
if (Date.now() > data.exp * 1000) {
    window.location.href = "/login"
}
```
- La validación de expiración en JavaScript puede ser bypasseada.
- La validación real debe ocurrir SIEMPRE en el servidor.
- **Fix:** Confiar solo en la validación del backend; el cliente puede redirigir pero nunca es la guardia de seguridad.

---

### 2.6 `parseJwt` sin Validación de Firma ni try-catch
**Archivo:** `order-ui/src/components/misc/Helpers.js` (líneas 1-6)
```javascript
const base64 = base64Url.replace('-', '+').replace('_', '/')
```
- `replace('-', '+')` solo reemplaza el **primer** caracter (bug — falta `/g`).
- Sin `try-catch`: un token malformado crashea la app.
- No valida la firma JWT (se decodifica ciegamente).
- **Fix:**
  ```javascript
  export function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1]
      if (!base64Url) return null
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      return JSON.parse(atob(base64))
    } catch {
      return null
    }
  }
  ```

---

### 2.7 DELETE de Órdenes sin Verificar Propiedad
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/rest/OrderController.java` (líneas 61-67)
```java
@DeleteMapping("/{id}")
public OrderDto deleteOrders(@PathVariable UUID id) {
    Order order = orderService.validateAndGetOrder(id.toString());
    orderService.deleteOrder(order);
    return OrderDto.from(order);
}
```
- Cualquier ADMIN puede borrar órdenes de otros usuarios sin verificar si es el dueño.
- **Fix:** Validar que el usuario autenticado sea el propietario o tenga permiso explícito.

---

### 2.8 GET de Órdenes sin Filtro por Usuario
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/rest/OrderController.java` (líneas 42-47)
- Un ADMIN puede ver las órdenes de TODOS los usuarios.
- Expone información de otros usuarios sin restricción granular.
- **Fix:** Filtrar por usuario actual para roles no-admin.

---

### 2.9 CustomUserDetails No Implementa isEnabled/isAccountNonLocked
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/security/CustomUserDetails.java`
- Faltan los métodos `isAccountNonExpired`, `isAccountNonLocked`, `isCredentialsNonExpired`, `isEnabled`.
- Es imposible desactivar o bloquear cuentas comprometidas.
- **Fix:** Agregar campo `enabled` en la entidad `User` e implementar los métodos correctamente.

---

### 2.10 ErrorAttributesConfig Expone Stack Traces
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/config/ErrorAttributesConfig.java` (línea 21)
```java
.including(Include.EXCEPTION, Include.MESSAGE, Include.BINDING_ERRORS)
```
- `Include.EXCEPTION` devuelve el stack trace completo en las respuestas HTTP de error.
- Un atacante obtiene información sobre librerías, versiones y rutas del classpath.
- **Fix:** Eliminar `Include.EXCEPTION` en producción.

---

### 2.11 Sin Auditoría en Operaciones Críticas (DELETE de usuarios/órdenes)
**Archivos:** `UserController.java`, `OrderController.java`
- No se registra quién eliminó qué ni cuándo.
- Sin capacidad de trazabilidad ni cumplimiento normativo.
- **Fix:** Agregar logging estructurado con el usuario autenticado en cada operación de escritura.

---

### 2.12 Payload del JWT Almacenado en localStorage junto al Token
**Archivo:** `order-ui/src/components/home/Login.js` (líneas 33-36)
```javascript
const authenticatedUser = { data, accessToken }
Auth.userLogin(authenticatedUser)
```
- Se guarda el token Y su payload decodificado (con roles y datos del usuario).
- Doble exposición de información sensible en localStorage.
- **Fix:** Decodificar el token al vuelo cuando sea necesario, no guardarlo en estado.

---

## 3. VULNERABILIDADES MEDIAS

### 3.1 Swagger UI Accesible Públicamente
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/security/SecurityConfig.java` (línea 39)
- `/swagger-ui/**` y `/v3/api-docs/**` están en `permitAll()`.
- Expone la estructura completa de la API sin autenticación.
- **Fix:** Desactivar Swagger en producción con `springdoc.api-docs.enabled=false`.

---

### 3.2 Logging de Spring Security en DEBUG
**Archivo:** `order-api/src/main/resources/application.yml` (líneas 23-24)
```yaml
logging.level.org.springframework.security: DEBUG
```
- En DEBUG, Spring Security puede loguear tokens, credenciales y detalles sensibles.
- **Fix:** Usar `INFO` o `WARN` en producción.

---

### 3.3 Sin Validación de Longitud en Campos de Registro
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/rest/dto/SignUpRequest.java`
```java
@NotBlank String username,
@NotBlank String password,
```
- No hay `@Size(max = ...)`: un atacante puede enviar strings de 100.000 caracteres.
- Sin validación de fortaleza de contraseña.
- **Fix:**
  ```java
  @Size(min = 3, max = 50) @NotBlank String username,
  @Size(min = 8, max = 100) @NotBlank String password,
  ```

---

### 3.4 Búsqueda sin Paginación ni Límite de Texto
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/rest/OrderController.java` (líneas 42-43)
```java
@GetMapping
public List<OrderDto> getOrders(@RequestParam(value = "text", required = false) String text) {
```
- Sin `Pageable` ni límite en el parámetro `text`.
- Con muchas órdenes, retorna todo en memoria → posible OOM.
- **Fix:** Agregar `Pageable` y `@Size(max = 100)` en el parámetro `text`.

---

### 3.5 `PublicController` Carga Todos los Registros para Contar
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/rest/PublicController.java` (líneas 18-26)
```java
return userService.getUsers().size();    // Carga TODOS los usuarios en memoria
return orderService.getOrders().size();  // Carga TODAS las órdenes en memoria
```
- Para contar, se cargan todas las filas en memoria y luego se llama `.size()`.
- Con millones de registros: `OutOfMemoryError`.
- **Fix:**
  ```java
  return userRepository.count();   // SELECT COUNT(*) — eficiente
  return orderRepository.count();
  ```

---

### 3.6 DELETE de Usuarios sin Proteger Cuenta Admin (solo en Frontend)
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/rest/UserController.java` (líneas 49-55)
- La protección para no eliminar `admin` existe solo en el frontend (`UserTable.js`).
- Directamente vía API, cualquier ADMIN puede eliminar la cuenta `admin`.
- **Fix:** Agregar validación en el backend:
  ```java
  if ("admin".equals(username)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
  ```

---

### 3.7 Manejo de Errores Silencioso en TokenAuthenticationFilter
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/security/TokenAuthenticationFilter.java` (líneas 31-43)
```java
} catch (Exception e) {
    log.error("Cannot set user authentication", e);
}
chain.doFilter(request, response); // Continúa sin autenticación
```
- Si `loadUserByUsername()` falla, el error se silencia y la request continúa como anónima.
- Dificulta el debugging y puede enmascarar ataques.
- **Fix:** Diferenciar tipos de excepción y responder con 401 cuando corresponda.

---

### 3.8 DatabaseInitializer Acoplado a Datos Hardcodeados
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/runner/DatabaseInitializer.java`
- Los usuarios de prueba están directamente en el código Java.
- Violación de SRP: una clase de inicialización no debería conocer los datos concretos.
- **Fix:** Leer los datos desde `application.yml` o un archivo `data-dev.sql`.

---

### 3.9 Dependencias de Test Incorrectas en pom.xml
**Archivo:** `order-api/pom.xml` (líneas 89-107)
- Existen referencias a artefactos Maven que no existen en Spring Boot (p.ej. `spring-boot-starter-data-jpa-test`).
- El build de tests probablemente falla o tiene dependencias que no resuelven correctamente.
- **Fix:** Revisar y corregir cada dependencia de test contra el BOM de Spring Boot.

---

## 4. VULNERABILIDADES BAJAS / MALAS PRÁCTICAS

### 4.1 Sin Índices en Campos de Búsqueda
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/order/OrderRepository.java` (línea 13)
```java
findByIdContainingOrDescriptionContainingIgnoreCaseOrderByCreatedAt(...)
```
- Las búsquedas `LIKE %text%` sin índice FULL-TEXT son lentas en tablas grandes.
- **Fix:** Agregar índice de texto completo en PostgreSQL (`GIN`/`GiST`).

---

### 4.2 `CreateOrderRequest` sin Límite de Tamaño en Descripción
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/rest/dto/CreateOrderRequest.java`
```java
@NotBlank String description
```
- Sin `@Size(max = ...)`, se pueden insertar strings de tamaño arbitrario.
- **Fix:** `@Size(max = 500) @NotBlank String description`.

---

### 4.3 Validación de Rol Solo en Cliente
**Archivos:** `AdminPage.js` (línea 23), `UserPage.js` (línea 12)
```javascript
setIsAdmin(user.data.rol[0] === 'ADMIN')
```
- Lógica de autorización duplicada y en el cliente.
- Un atacante con acceso a localStorage puede manipular el estado.
- **Fix:** Consolidar la lógica en un hook `useRole()` y asegurarse de que el servidor siempre valide.

---

### 4.4 Bug: `replace` sin Flag Global en parseJwt
**Archivo:** `order-ui/src/components/misc/Helpers.js` (línea 4)
```javascript
const base64 = base64Url.replace('-', '+').replace('_', '/')
//                               ^^^                ^^^
//                        Solo reemplaza el PRIMER caracter
```
- Debe usar `/g` para reemplazar TODAS las ocurrencias.
- **Fix:** `base64Url.replace(/-/g, '+').replace(/_/g, '/')`

---

### 4.5 `handleLogError` Usa solo `console.log`
**Archivo:** `order-ui/src/components/misc/Helpers.js` (líneas 8-15)
- Los logs de consola desaparecen al cerrar el navegador.
- Sin niveles de severidad, timestamps ni integración a un servicio de logging.
- **Fix:** Integrar un servicio de logging frontend (Sentry, Datadog, etc.) o al menos `console.error`.

---

### 4.6 `AuthContext` sin Validación de Null en Parse de localStorage
**Archivo:** `order-ui/src/components/context/AuthContext.js` (línea 9)
```javascript
const storedUser = JSON.parse(localStorage.getItem('user'))
```
- `JSON.parse(null)` retorna `null`, lo cual está bien, pero si el valor guardado es JSON inválido, crashea.
- **Fix:**
  ```javascript
  try {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    setUser(storedUser)
  } catch {
    localStorage.removeItem('user')
  }
  ```

---

### 4.7 N+1 Queries en `UserDto.from()`
**Archivo:** `order-api/src/main/java/com/ivanfranchin/orderapi/rest/dto/UserDto.java` (líneas 18-30)
```java
List<OrderDto> orders = user.getOrders().stream()...
```
- Si se mapean 100 usuarios, se ejecutan 100 queries adicionales para cargar las órdenes (N+1).
- **Fix:** Usar `JOIN FETCH` en el repositorio o `FetchType.EAGER` con cuidado:
  ```java
  @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.orders")
  List<User> findAllWithOrders();
  ```

---

### 4.8 Java 25 Como Versión Requerida (No LTS)
**Archivo:** `order-api/pom.xml` (línea 30)
```xml
<java.version>25</java.version>
```
- Java 25 no es versión LTS.
- Puede haber incompatibilidades con librerías del ecosistema.
- **Fix:** Considerar Java 21 LTS para producción.

---

## RECOMENDACIONES PRIORITARIAS

### Inmediato (antes de poner en producción)
1. Cambiar todas las credenciales hardcodeadas (DB, JWT, Docker) a variables de entorno.
2. Cambiar `ddl-auto: create` → `validate`.
3. Añadir `@Profile("dev")` a `DatabaseInitializer`.
4. Implementar Rate Limiting en `/auth/authenticate` y `/auth/signup`.
5. Eliminar `Include.EXCEPTION` de `ErrorAttributesConfig`.

### Corto plazo
6. Corregir el bug de `replace` en `parseJwt` (falta `/g`).
7. Agregar `@Size` a todos los DTOs de entrada.
8. Reemplazar `getUsers().size()` y `getOrders().size()` por `COUNT(*)`.
9. Proteger la cuenta `admin` en el backend (no solo en el frontend).
10. Desactivar Swagger en producción.
11. Validar propiedad de órdenes en el DELETE del backend.

### Mediano plazo
12. Reemplazar localStorage por cookies `httpOnly` para el JWT.
13. Implementar CSRF protection.
14. Agregar paginación en todos los endpoints de lista.
15. Implementar auditoría en operaciones críticas (DELETE de usuarios/órdenes).
16. Implementar `isEnabled`, `isAccountNonLocked` en `CustomUserDetails`.

### Largo plazo
17. Considerar OAuth2/OIDC (Keycloak, Auth0) en lugar de JWT manual.
18. Agregar tests unitarios e integración con cobertura mínima del 70%.
19. Implementar FULL-TEXT search con índices GIN/GiST en PostgreSQL.
20. Auditoría de seguridad externa antes de go-live.
