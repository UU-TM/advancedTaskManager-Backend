# CLAUDE.md — Auth Module

> **Scope:** This file covers the **authentication slice only** (`/auth/*` + the `User` entity). It is not the whole-project CLAUDE.md. Don't touch other modules from here.

---

## Stack

- **Framework:** NestJS
- **DB / ORM:** PostgreSQL + Prisma
- **Auth:** `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`
- **Hashing:** `bcrypt`
- **Validation:** `nestjs-zod` (Zod-based)
- **Logging:** Winston (project-wide, don't reconfigure here)

---

## Architecture rules (non-negotiable)

Strict one-directional layered flow. Dependencies point **down only**:

```
Controller  ->  Service  ->  Repository (Prisma)
   (HTTP)      (logic)        (persistence)
```

- Controllers: parse/validate input, call one service method, return a value. **No business logic. No DB access.**
- Services: all logic, hashing, token issuance, rotation. Never import `Request`/`Response`.
- Repository/Prisma: persistence only. No HTTP concepts, no bcrypt.
- A lower layer **never** imports an upper one.

---

## The contract (this is the source of truth)

### Routes

| Method | Path             | Guard              | Purpose                          |
|--------|------------------|--------------------|----------------------------------|
| POST   | `/auth/register` | none               | Create account                   |
| POST   | `/auth/login`    | none               | Authenticate, issue token pair   |
| POST   | `/auth/refresh`  | `JwtRefreshGuard`  | Rotate access token              |
| POST   | `/auth/logout`   | `JwtAuthGuard`     | Invalidate refresh token         |
| GET    | `/auth/me`       | `JwtAuthGuard`     | Current user profile             |

### `User` entity

| Field              | Type       | Notes                             |
|--------------------|------------|-----------------------------------|
| `id`               | UUID       | PK                                |
| `username`         | String     | Unique, indexed                   |
| `passwordHash`     | String     | bcrypt                            |
| `refreshTokenHash` | String?    | Nullable; bcrypt hash of current refresh token |
| `createdAt`        | Timestamp  | auto                              |
| `updatedAt`        | Timestamp  | auto                              |

### Response wrapper (every response, success and error)

```json
{ "message": "String", "status": 200, "data": { } }
```

Implement this **globally**, not by hand in each controller:
- A `TransformInterceptor` wraps successful returns into `{ message, status, data }`.
- The per-endpoint `message` comes from a `@ResponseMessage('...')` decorator (`SetMetadata` + `Reflector`), so controllers just return `data`.
- An `HttpExceptionFilter` shapes thrown exceptions into the same envelope.

Example returns to match exactly:
- Login `data`: `{ accessToken, refreshToken, user: { id, username } }`, message `"Login successful"`.
- Me `data`: `{ id, username }`, message `"User profile retrieved"`.

---

## Security rules

- **Never** return `passwordHash` or `refreshTokenHash` in any response. The user shape exposed to clients is `{ id, username }` — define it once as a mapper/DTO and reuse it.
- Access token payload: `{ sub: userId, username }`. Short TTL (e.g. 15m).
- Refresh token: longer TTL (e.g. 7d), **separate secret** from the access token (`JWT_ACCESS_SECRET` vs `JWT_REFRESH_SECRET`).
- **Rotation on refresh:** on every successful `/auth/refresh`, issue a new pair AND overwrite `refreshTokenHash` with the hash of the new refresh token.
- **Refresh validation:** decode the refresh JWT → get `sub` → load user → `bcrypt.compare(presentedToken, user.refreshTokenHash)`. You cannot look a user up *by* the hash (bcrypt is salted), which is why `sub` lives in the payload.
- **Logout:** set `refreshTokenHash = null`. A refresh with a null stored hash must fail.
- Login must fail identically for "unknown username" and "wrong password" (don't leak which). Do a bcrypt compare against a dummy hash for unknown users if you want to avoid timing leaks — optional for MVP.
- Register: reject duplicate `username` with a clean 409, not a raw DB error.

## The two strategies

- `JwtStrategy` (access): extracts Bearer token from `Authorization` header, validates against `JWT_ACCESS_SECRET`, attaches `{ userId, username }` to `req.user`. Backs `JwtAuthGuard`.
- `JwtRefreshStrategy` (refresh): validates against `JWT_REFRESH_SECRET`, uses `passReqToCallback: true` so `validate()` can read the raw refresh token and hand it (plus the decoded payload) to the service for the `bcrypt.compare`. Backs `JwtRefreshGuard`.

---

## Conventions

- One folder: `src/auth/` (module, controller, service, strategies, guards, dtos, decorators). `User` model can live in `src/users/` if the group wants a separate users module; keep auth depending on users, not the reverse.
- All env secrets via `ConfigService`, never `process.env` inline.
- DTOs define the *input* shape and are validated at the controller edge. Nothing unvalidated reaches a service.

## Settled decisions

1. **Refresh token transport:** returned in the JSON body (API-first). `/auth/refresh` reads the refresh token from the request body.
2. **Sessions:** single active session per user — one `refreshTokenHash` column. A new login overwrites it (logging in elsewhere invalidates the prior refresh token). No multi-device support in this slice.
3. **Validation:** `nestjs-zod` — do not mix in `class-validator`.

## Git & workflow (strict)

- **"Commit" means: stage the relevant changes and make a git commit with a meaningful message describing what actually changed.** Not `"update"`, `"changes"`, `"wip"`, or `"fix"`. Describe the change and why, e.g. `"add JwtRefreshStrategy with body-field extraction"` or `"reject duplicate username in register with 409"`. One logical change per commit where reasonable.
- **Never push unless I explicitly say "push".** Committing is fine when I ask for it; pushing to the remote is not implied by a commit and must be a separate, explicit instruction. If in doubt, commit and stop.
- Don't run `git push --force` / history-rewriting commands unless I explicitly ask for that specific action.

## Do NOT

- Put logic in controllers or DB calls outside the repository layer.
- Hand-roll the response envelope per endpoint.
- Log tokens, password hashes, or raw passwords (Winston or otherwise).
- Reuse one JWT secret for both token types.
