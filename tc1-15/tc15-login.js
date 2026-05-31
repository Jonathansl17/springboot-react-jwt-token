import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 30,
  duration: "90s",
};

export default function () {
  const payload = JSON.stringify({
    username: "user",
    password: "user",
  });

  const res = http.post("http://localhost:8080/auth/authenticate", payload, {
    headers: { "Content-Type": "application/json" },
  });

  check(res, { "status es 200": (r) => r.status === 200 });
}
