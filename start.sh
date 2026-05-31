#!/bin/bash
fuser -k 8080/tcp 2>/dev/null || true
sudo systemctl start docker.service
docker compose up -d

(cd /home/jony/springboot-react-jwt-token/order-api && ./mvnw spring-boot:run) &
(cd /home/jony/springboot-react-jwt-token/order-ui && /home/jony/.local/share/pnpm/pnpm start) &

wait
