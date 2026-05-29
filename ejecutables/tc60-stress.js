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
