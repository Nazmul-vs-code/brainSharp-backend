# PostgreSQL Crash Course

![Node.js](https://img.shields.io/badge/Node.js-ES_modules-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-REST_API-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-database-4169E1?logo=postgresql&logoColor=white)

A small learning project demonstrating a REST API built with **Express.js**, **PostgreSQL**, and **Sequelize**. It connects to a PostgreSQL database and provides endpoints to create users and retrieve saved user records.

> This README describes the current code. Implementation quirks and suggested improvements are called out separately so they are not mistaken for features that already exist.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [Database Configuration](#database-configuration)
- [API Documentation](#api-documentation)
- [Testing with Postman](#testing-with-postman)
- [Database Verification](#database-verification)
- [Deployment Notes](#deployment-notes)
- [Common Errors and Troubleshooting](#common-errors-and-troubleshooting)
- [Learning Outcomes](#learning-outcomes)
- [Current Limitations and Future Improvements](#current-limitations-and-future-improvements)

## Features

- Connects to PostgreSQL through Sequelize.
- Defines a `User` model with required name, email, phone number, and message fields.
- Creates a user record.
- Retrieves all user records.
- Retrieves one user by primary key.
- Accepts and returns JSON for the API endpoints.

## Technology Stack

| Technology / dependency | Purpose |
| --- | --- |
| Node.js (ES modules) | JavaScript runtime and module format |
| Express.js (`express`) | HTTP server, routing, and JSON request parsing |
| PostgreSQL (`pg`) | Database server and Sequelize's PostgreSQL driver |
| Sequelize (`sequelize`) | ORM, model definition, queries, and schema synchronization |
| `pg-hstore` | PostgreSQL `HSTORE` support for Sequelize |
| `dotenv` | Loads variables from `.env` into `process.env` |
| `cors` | Installed, but CORS middleware is currently commented out |
| `init` | Installed; no usage is present in the application code |

The `start` script also invokes `nodemon`, but `nodemon` is not listed in `package.json` dependencies. See [Installation and Setup](#installation-and-setup).

## Project Structure

```text
.
├── App/
│   ├── config/
│   │   └── connection.js       # Sequelize/PostgreSQL connection
│   ├── controller/
│   │   └── UserController.js   # Create and read user handlers
│   ├── models/
│   │   ├── AllMode.js
│   │   └── User.js             # User model and table mapping
│   └── routes/
│       ├── FrontendRoutes.js   # /web route group
│       └── UserRoute.js        # User API endpoints
├── .env.example                # Safe environment-variable template
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js                   # Loads configuration and starts the server
```

## Prerequisites

- Node.js and npm.
- Access to a PostgreSQL database, either local or hosted.
- An API client such as Postman to send POST requests.

## Installation and Setup

1. Clone the project using the clone address provided for your copy of the repository:

   ```bash
   git clone <repository-clone-address>
   cd <project-directory>
   ```

2. Install the dependencies recorded in `package-lock.json`:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`, then replace the sample values with your PostgreSQL connection details. Keep `.env` private; it is excluded by `.gitignore`.

4. Start the application:

   ```bash
   node server.js
   ```

   The server reads `PORT` from the environment and logs the local address when it starts. The package's `npm start` script is configured as `nodemon server.js`, but `nodemon` is not declared as a project dependency. Therefore, `npm start` works only when `nodemon` is already available in your environment.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | Yes | Port used by Express. There is no fallback port in the current server code. |
| `DATABASE_URL` | Yes | PostgreSQL connection URL passed directly to Sequelize. |

Use [`.env.example`](./.env.example) as a template. Replace all placeholders in your local `.env` file. The example URL includes `sslmode=require`, which is commonly appropriate for hosted PostgreSQL providers; for a local database, use the connection details and SSL options appropriate to your local setup.

Do not commit `.env` or put real credentials in `.env.example`.

## Database Configuration

`App/config/connection.js` creates a Sequelize instance using `DATABASE_URL` and the PostgreSQL dialect. SQL logging is disabled. The `User` model in `App/models/User.js` maps to the table named **`users`** and defines:

| Column | Type / behavior |
| --- | --- |
| `id` | Auto-incrementing integer primary key |
| `UserName` | Required string |
| `UserEmail` | Required, unique string |
| `PhoneNumber` | Required string |
| `Message` | Required text |
| `createdAt`, `updatedAt` | Sequelize-managed timestamps (`timestamps: true`) |

On startup, `server.js` calls `Connection.sync({ alter: true })`. Sequelize therefore attempts to adjust the table schema to match the model. This is convenient for a learning project, but automatic schema alteration should be reviewed carefully and is not a substitute for managed migrations in production.

**Current behavior to be aware of:** the database authentication function catches and logs an authentication error instead of rethrowing it. The server code then proceeds to call synchronization and start listening; synchronization is not awaited. Consequently, a startup message does not by itself confirm that the database is ready.

## API Documentation

The server mounts `FrontendRoutes` at `/api`, that router mounts user routes at `/web`, and the individual endpoints are defined in `UserRoute.js`. The resulting paths are:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/web/create` | Create a user |
| `GET` | `/api/web/view` | Retrieve all users |
| `GET` | `/api/web/users/:id` | Retrieve a user by primary key |

All examples below assume the server is running on port `5000`; replace the port if your `PORT` differs.

### Create a user

**Request**

```http
POST /api/web/create
Content-Type: application/json
```

```json
{
  "UserName": "Amina Rahman",
  "UserEmail": "amina.rahman@example.com",
  "PhoneNumber": "+1-555-0102",
  "Message": "I am learning how to connect an Express API to PostgreSQL."
}
```

Each of `UserName`, `UserEmail`, `PhoneNumber`, and `Message` must be present and non-empty. A successful create returns **201 Created** with the created Sequelize record:

```json
{
  "message": "User is Created Successfully!",
  "status": true,
  "data": {
    "id": 1,
    "UserName": "Amina Rahman",
    "UserEmail": "amina.rahman@example.com",
    "PhoneNumber": "+1-555-0102",
    "Message": "I am learning how to connect an Express API to PostgreSQL.",
    "updatedAt": "2026-01-15T10:30:00.000Z",
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
}
```

The ID and timestamps above are illustrative; PostgreSQL/Sequelize supplies the actual values.

Missing or empty fields return **400 Bad Request**:

```json
{
  "message": "All fields are required.",
  "status": false
}
```

The model also requires unique email addresses. A duplicate email or other database error enters the create handler's error path; see [Current Limitations and Future Improvements](#current-limitations-and-future-improvements) for a current error-handling defect.

### Retrieve all users

**Request:** `GET /api/web/view`

When records exist, the current implementation responds with **302** and a JSON body shaped like this:

```json
{
  "status": true,
  "Data": [
    {
      "id": 1,
      "UserName": "Amina Rahman",
      "UserEmail": "amina.rahman@example.com",
      "PhoneNumber": "+1-555-0102",
      "Message": "I am learning how to connect an Express API to PostgreSQL.",
      "createdAt": "2026-01-15T10:30:00.000Z",
      "updatedAt": "2026-01-15T10:30:00.000Z"
    }
  ]
}
```

The `302` status is what the code currently sends; it is unusual for a successful retrieval. If there are no records, the endpoint responds with **404 Not Found**:

```json
{
  "message": "User not found !",
  "status": false
}
```

### Retrieve a user by ID

**Request:** `GET /api/web/users/1`

A found record returns **200 OK** as a serialized user object:

```json
{
  "id": 1,
  "UserName": "Amina Rahman",
  "UserEmail": "amina.rahman@example.com",
  "PhoneNumber": "+1-555-0102",
  "Message": "I am learning how to connect an Express API to PostgreSQL.",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

If no record has that primary key, the response is **404 Not Found**:

```json
{
  "error": "User not found"
}
```

### Request and error notes

- Use `Content-Type: application/json` for the create request. Express parses JSON request bodies.
- A browser address bar sends a **GET** request. Use Postman or another API client to send the **POST** request to create a user.
- The read handlers attempt to return **500 Internal Server Error** JSON for caught errors. The create handler's error path currently has a defect, so a database failure may not return the same JSON error format.

## Testing with Postman

1. Start the server and confirm that the configured `PORT` is listening.
2. **Create a user:** choose **POST**, enter `http://localhost:5000/api/web/create` (adjust the port if needed), select **Body → raw → JSON**, and send all four required fields shown in [Create a user](#create-a-user). Expect status `201`.
3. **Retrieve all users:** choose **GET** and enter `http://localhost:5000/api/web/view`. With at least one saved record, the current code returns status `302` and a `Data` array. With no records, it returns `404`.
4. **Retrieve one user:** choose **GET** and enter `http://localhost:5000/api/web/users/1`, replacing `1` with the `id` returned by the create response. Expect `200` if it exists or `404` if it does not.

## Database Verification

Connect to the same PostgreSQL database specified by `DATABASE_URL`. In `psql`, a PostgreSQL GUI, or Neon’s SQL Editor (if using Neon), run:

```sql
SELECT
  id,
  "UserName",
  "UserEmail",
  "PhoneNumber",
  "Message",
  "createdAt",
  "updatedAt"
FROM users
ORDER BY id;
```

The table is named `users`. The quoted mixed-case column names reflect the model's field names; PostgreSQL folds unquoted identifiers to lowercase.

## Deployment Notes

1. Choose a Node.js hosting service and provision a PostgreSQL database reachable from the deployed application.
2. Configure `PORT` as required by the host and set `DATABASE_URL` using the host's protected environment-variable settings. Do not upload `.env` or commit credentials.
3. Install dependencies from the project's package manifest/lockfile, then configure the service to launch the application with Node.js.
4. Review database networking and SSL requirements, and verify that schema synchronization behaves appropriately for the deployment environment.
5. Check application and database logs after deployment. No live deployment address is included in this guide.

The current project uses automatic Sequelize `alter` synchronization and does not include a production migration workflow. Consider introducing reviewed migrations and fail-fast database startup behavior before relying on it for production.

## Common Errors and Troubleshooting

| Symptom | Possible cause and next step |
| --- | --- |
| Database connection fails | Check that `DATABASE_URL` has the correct username, password, host, port, and database name; confirm network access and the provider's SSL requirements. |
| Environment variable is missing | Ensure `.env` exists in the project root, is based on `.env.example`, and contains both `PORT` and `DATABASE_URL`. Never paste real credentials into shared logs or the README. |
| Server reports it started but database requests fail | The authentication helper logs errors without stopping startup, and the subsequent schema synchronization is not awaited. Check the earlier database log and validate the connection independently. |
| Create request returns 400 | Send a JSON object containing all four non-empty, correctly capitalized keys: `UserName`, `UserEmail`, `PhoneNumber`, and `Message`. |
| POST endpoint does not work in a browser address bar | The address bar issues GET, not POST. Use Postman or another API client and select the POST method. |
| Endpoint returns an unexpected response or method error | Verify the exact HTTP method and path in [API Documentation](#api-documentation); in particular, use GET for both read endpoints. |
| User lookup returns 404 | Confirm the ID exists in the `users` table. The all-users endpoint also returns 404 when the table has no rows. |
| `npm start` reports `nodemon` is not recognized | `nodemon` is not declared in this project's dependencies. Use `node server.js`, or arrange for `nodemon` to be installed in your development environment. |

## Learning Outcomes

This project is a starting point for learning how to:

- connect a Node.js application to PostgreSQL;
- define a Sequelize model and map it to a database table;
- build REST endpoints with Express and JSON;
- load local configuration from environment variables;
- create, query, and inspect persisted database records; and
- prepare a backend for deployment by configuring its runtime and database environment.

## Current Limitations and Future Improvements

The following are observations and recommendations, not existing features:

- **Current:** `GET /api/web/view` returns status `302` for a successful result. **Recommended:** use `200 OK` for a normal successful retrieval.
- **Current:** the authentication error is logged and swallowed; schema synchronization is not awaited. **Recommended:** fail startup when the database is unavailable and await synchronization or migrations.
- **Current:** the create handler calls its error helper without passing the caught error, while the helper reads `err.message`. **Recommended:** pass the error through and handle expected cases, such as a duplicate email, with deliberate API responses.
- **Current:** `npm start` invokes `nodemon`, which is not declared in `package.json`. **Recommended:** add it as a development dependency or change the script to use an available runtime command.
- **Current:** CORS middleware is commented out. **Recommended:** configure CORS deliberately if a browser-based frontend on another origin needs access.
- **Current:** schema updates use Sequelize `alter: true`. **Recommended:** use reviewed database migrations for production schema changes.
