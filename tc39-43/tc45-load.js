import http from 'k6/http';
import { check, sleep } from 'k6';

// TC-45: Multiples solicitudes simultaneas a pedidos
// Objetivo: verificar que el sistema maneje correctamente 50 usuarios
// virtuales creando pedidos de forma simultanea durante 1 minuto.
// Umbral: p(95) < 1000ms, tasa de fallos < 1%

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Pre: obtener token de autenticacion
  const login = http.post(
    'http://localhost:8080/auth/authenticate',
    JSON.stringify({ username: 'user', password: 'user' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(login, { 'login 200': r => r.status === 200 });

  const token = login.json('accessToken');

  // Post: crear un pedido simultaneamente con otros usuarios
  const order = http.post(
    'http://localhost:8080/api/orders',
    JSON.stringify({ description: `Pedido de carga - VU${__VU} iter${__ITER}` }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  check(order, { 'order creado 201': r => r.status === 201 });

  sleep(1);
}