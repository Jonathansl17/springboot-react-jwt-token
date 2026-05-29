import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
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
