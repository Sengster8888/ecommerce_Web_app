# NestJS Backend Setup Flow & Health API Testing Guide
*(E-Commerce Management System for Cambodia)*

This technical blueprint details the sequential flow for scaffolding, configuring, and validating a NestJS backend tailored to the Cambodian E-Commerce Web App [1, 80]. It focuses on establishing a solid foundation in **Phase 3 (Backend Setup)**, ensuring the database connections, modular scaffolding, and health-monitoring endpoints function reliably before diving into application logic [84].

---

## 1. Backend Setup & Scaffolding Flow

To construct a stateless, layered backend [79, 22.1], you must follow an incremental initialization flow. This ensures that environmental variables, ORM mappings, and validation pipelines are established in sequence.

### Setup Flow Diagram
```mermaid
graph TD
    A[Start: Phase 3 Setup] --> B[Scaffold NestJS Project CLI]
    B --> C[Install Core Dependencies: Prisma, Terminus, Validation Pipes]
    C --> D[Configure Environment Variables in .env]
    D --> E[Initialize Database Migration via Prisma/PostgreSQL]
    E --> F[Scaffold Domain Modules & Directory Layout]
    F --> G[Register Common Validation Pipes & NestJS Guards]
    G --> H[Create HealthCheck Module & HealthController]
    H --> I[Boot Backend Application via npm run start:dev]
    I --> J[Probe Health Check API via Curl/HTTP REST Client]
    J --> K[End: Runnable Backend Skeleton Verified]
```

---

## 2. Directory Structure Blueprint
Scaffold your backend modules cleanly within the `src/` directory to isolate business logic, enforce TypeScript types, and guarantee maintainability [79, 81].

```
src/
├── main.ts               # Application entry point & pipeline bootstrap
├── app.module.ts         # Central module importing all domain modules
├── auth/                 # Phase 4: Registration, login, JWT strategy, RBAC guards [81]
├── users/                # Phase 4: User roles ('customer', 'admin') & credentials [38, 81]
├── products/             # Phase 5: Products, categories, and images catalog [40, 82]
├── cart/                 # Phase 6: Carts & cart_items with stock validation [43, 82]
├── orders/               # Phase 7 & 8: Orders, line items, and state machine [44, 82]
├── payments/             # Phase 10: Simulated KHQR/Bakong & COD workflows [46, 82]
├── order-tracking/       # Phase 11: Append-only state transition audit logs [47, 82]
├── telegram/             # Phase 9: Webhook receiver & outbound admin chat [48, 82]
├── health/               # Terminus health module & database probe
└── common/               # Request validation DTOs, pipes, filters, & decorators [82]
```

---

## 3. Step-by-Step Installation & Project Scaffolding

Follow these commands to install the NestJS CLI, scaffold the project, and pull in the essential development packages [80].

### Step 3.1: Project Initialisation
```bash
# Install NestJS CLI globally if missing
npm install -g @nestjs/cli

# Scaffold the workspace using npm
nest new ecommerce-backend --package-manager npm
cd ecommerce-backend
```

### Step 3.2: Pull Core Development Packages
Install Terminus (health-monitoring utility), Prisma ORM (to connect to PostgreSQL), and the class-validator pipes [80, 83]:
```bash
# Health-checking utility
npm install @nestjs/terminus

# Prisma ORM and DB Client
npm install @prisma/client
npm install --save-dev prisma

# Input Validation and Type Transformations
npm install class-validator class-transformer

# JWT Auth & Password Hashing (Pre-Phase 4 requirements)
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install --save-dev @types/passport-jwt @types/bcrypt
```

### Step 3.3: Configuration and Environment Setup
Create a `.env` file in the application's root directory to declare secrets, credentials, and API variables [72]:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:securepassword@localhost:5432/ecommerce_db?schema=public"
JWT_SECRET="your-ultra-secure-jwt-secret-key-change-in-production"
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_CHAT_ID="your-telegram-admin-group-or-chat-id"
```

---

## 4. Implementing the Health API

Using `@nestjs/terminus`, we define a health endpoint `GET /api/health` to examine both the main process's responsiveness and PostgreSQL database connectivity.

### Step 4.1: Scaffolding the Prisma Service
Initialize a boilerplate Prisma client service to execute queries against your PostgreSQL instance:
`src/prisma/prisma.service.ts`
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Step 4.2: Creating the Health Check Module
`src/health/health.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class HealthModule {}
```

### Step 4.3: Creating the Health Controller
`src/health/health.controller.ts`
```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Execute a ping command through Prisma to confirm PostgreSQL connectivity
      () => this.prismaIndicator.pingCheck('database', this.prisma),
    ]);
  }
}
```

---

## 5. Testing the Health API (Phase 3 Validation)

Once implementation is complete, run the server inside development mode [84]:
```bash
npm run start:dev
```

In a separate terminal, probe the API to confirm status.

### Probing the Health API via curl
```bash
curl -i http://localhost:3000/api/health
```

### Output 5.1: Success Case (HTTP 200 OK)
When both the NestJS server is running and Postgres connection is open, the API returns:
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
```
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

### Output 5.2: Error Case (HTTP 503 Service Unavailable)
If PostgreSQL is unreachable, credentials are wrong, or migrations are corrupt, the server returns [75]:
```http
HTTP/1.1 503 Service Unavailable
Content-Type: application/json; charset=utf-8
```
```json
{
  "status": "error",
  "info": {},
  "error": {
    "database": {
      "status": "down",
      "message": "Database connection rejected or timed out"
    }
  },
  "details": {
    "database": {
      "status": "down",
      "message": "Database connection rejected or timed out"
    }
  }
}
```

This completes **Phase 3 — Backend Setup**. Your codebase skeleton is now validated, verified, and ready for authentication integration in Phase 4 [84].
