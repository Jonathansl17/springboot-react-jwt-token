import http from "k6/http";
import { check } from "k6";

// TC-29: Tiempo de respuesta al listar pedidos con pocos registros (~15 pedidos)
// El usuario ve sus ordenes via GET /api/users/me (no GET /api/orders que requiere ADMIN)
// Umbral: p95 menor a 1000ms

export const options = {
  vus: 1,
  iterations: 10,
  thresholds: {
    http_req_duration: ["p(95)<1000"],
  },
};

export function setup() {
  const res = http.post(
    "http://localhost:8080/auth/authenticate",
    JSON.stringify({ username: "user", password: "user" }),
    { headers: { "Content-Type": "application/json" } }
  );
  return { token: res.json("accessToken") };
}

export default function (data) {
  const res = http.get("http://localhost:8080/api/users/me", {
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  });

  check(res, {
    "status es 200": (r) => r.status === 200,
    "tiempo de respuesta menor a 1000ms": (r) => r.timings.duration < 1000,
  });
}
