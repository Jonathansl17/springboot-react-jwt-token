import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 30,
  duration: "30s",
};

let counter = 0;

export default function () {
  counter++;
  const payload = JSON.stringify({
    username: `user${__VU}_${__ITER}`,
    password: "123",
    name: `User${__VU}`,
    email: `user${__VU}_${__ITER}@tec.com`,
  });

  const res = http.post("http://localhost:8080/auth/signup", payload, {
    headers: { "Content-Type": "application/json" },
  });

  check(res, { "status es 201": (r) => r.status === 201 });
  sleep(1);
}
