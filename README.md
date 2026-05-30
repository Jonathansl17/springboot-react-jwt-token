## Start Environment

- In a terminal, make sure you are inside the `springboot-react-jwt-token` root folder;

- Run the following command to start Docker Compose containers:
  ```bash
  docker compose up -d
  ```

## Running order-app using Maven & Npm

- **order-api**

  - Open a terminal and navigate to the `springboot-react-jwt-token/order-api` folder;

  - Run the following `Maven` command to start the application:
    ```bash
    ./mvnw clean spring-boot:run
    ```

- **order-ui**

  - Open another terminal and navigate to the `springboot-react-jwt-token/order-ui` folder;

  - Run the command below if you are running the application for the first time:
    ```bash
    npm install
    ```

  - Run the `npm` command below to start the application:
    ```bash
    npm start
    ```

## Applications URLs

| Application | URL                                   | Credentials                                         |
| ----------- | ------------------------------------- | --------------------------------------------------- |
| order-ui    | http://localhost:3000                 | `admin/admin`, `user/user` or signing up a new user |



- To stop `order-api` and `order-ui`, go to the terminals where they are running and press `Ctrl+C`;

- To stop and remove Docker Compose containers, network, and volumes, go to a terminal and, inside the `springboot-react-jwt-token` root folder, run the command below:
  ```bash
  docker compose down -v
  ```

