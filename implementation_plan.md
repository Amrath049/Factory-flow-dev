# Multi-Tenant SaaS Transformation Plan for Factory-Flow

Transforming Factory-Flow from a single-tenant factory management application into a multi-tenant B2B SaaS platform for manufacturing businesses on a subscription model.

---

## Architecture & Multi-Tenancy Overview

```
                      ┌─────────────────────────────────────────┐
                      │              SUPER ADMIN                │
                      │  Creates Business & Admin via Postman   │
                      └────────────────────┬────────────────────┘
                                           │
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │            POST /api/admin/             │
                      │         businesses & initial user       │
                      └────────────────────┬────────────────────┘
                                           │
                                           ▼
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                            TENANT ISOLATION                                 │
    │  JWT Token contains: { userId, businessId, role, email, businessName }      │
    └──────────────────────────────────────┬──────────────────────────────────────┘
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         ▼                                                                   ▼
┌─────────────────────────────────┐                         ┌─────────────────────────────────┐
│     Tenant A (Factory Alpha)    │                         │      Tenant B (Factory Beta)    │
│  - Customers (businessId: A)    │                         │  - Customers (businessId: B)    │
│  - Products  (businessId: A)    │                         │  - Products  (businessId: B)    │
│  - Orders    (businessId: A)    │                         │  - Orders    (businessId: B)    │
│  - Inventory (businessId: A)    │                         │  - Inventory (businessId: B)    │
│  - InvoiceSettings (A)          │                         │  - InvoiceSettings (B)          │
└─────────────────────────────────┘                         └─────────────────────────────────┘
```

---

## User Review Required

> [!IMPORTANT]
> **Database Migration Alert**: Adding `businessId` to existing Prisma models is a breaking schema change. Existing data in your development PostgreSQL database will require a default tenant/business to be assigned during migration, or a database reset (`npx prisma migrate dev --name init_saas`).

> [!NOTE]
> **Postman API Provisioning**: Self-service registration on the frontend UI will be deferred for a future release. For now, new businesses and user accounts will be provisioned using a protected Postman endpoint (`POST /api/admin/tenants`).

---

## Proposed Changes

### Database & Schema Layer (`apps/backend/prisma/schema.prisma`)

#### [MODIFY] [schema.prisma](file:///d:/ProjectsRecent/Factory-flow-dev/apps/backend/prisma/schema.prisma)

1. **New Enums**:
   - `Role`: `SUPER_ADMIN`, `BUSINESS_ADMIN`, `STAFF`
   - `SubscriptionStatus`: `TRIAL`, `ACTIVE`, `SUSPENDED`, `CANCELLED`

2. **New Core Multi-Tenant Models**:
   - **`Business`**: Stores tenant metadata (`id`, `name`, `email`, `phone`, `address`, `status`, `plan`, `createdAt`, `updatedAt`).
   - **`User`**: Stores user authentication and access controls (`id`, `email`, `passwordHash`, `name`, `role`, `businessId` [nullable for super admin], `createdAt`, `updatedAt`).
   - **`InvoiceSettings`**: Stores per-tenant branding and invoice template configuration (`id`, `businessId` [unique key], `companyName`, `tagline`, `website`, `logoUrl`, `addressLine1`, `addressLine2`, `city`, `state`, `pincode`, `phone`, `email`, `gstin`, `pan`, `bankName`, `accountName`, `accountNumber`, `ifscCode`, `branch`, `termsAndConditions`, `declaration`, `signatureTitle`, `updatedAt`).

3. **Tenant-Scoped Existing Models**:
   - Add `businessId String` and relation to `Business` across:
     - `Customer` (`@@index([businessId])`)
     - `Product` (`@@index([businessId])`)
     - `Order` (`@@index([businessId])`)
     - `ProductionEntry` (`@@index([businessId])`)
     - `StockHistory` (`@@index([businessId])`)

---

### Backend Service & API Layer (`apps/backend/src`)

#### [MODIFY] [auth.service.ts](file:///d:/ProjectsRecent/Factory-flow-dev/apps/backend/src/auth/auth.service.ts) & [auth.controller.ts](file:///d:/ProjectsRecent/Factory-flow-dev/apps/backend/src/auth/auth.controller.ts)
- Replace environment variable check (`AUTH_EMAIL`, `AUTH_PASSWORD`) with `PrismaService` database user query.
- Use `bcrypt` for secure password hashing and comparison.
- Sign JWT with payload: `{ sub: user.id, email: user.email, role: user.role, businessId: user.businessId, businessName: user.business.name }`.
- Add endpoint `POST /api/auth/me` to get logged-in user profile & tenant info.

#### [NEW] [admin.module.ts](file:///d:/ProjectsRecent/Factory-flow-dev/apps/backend/src/admin/admin.module.ts)
- **`POST /api/admin/tenants`**: API endpoint for Postman provisioning.
  - Accepts: `businessName`, `businessEmail`, `phone`, `address`, `adminName`, `adminEmail`, `adminPassword`.
  - Atomically creates `Business`, default `InvoiceSettings`, and initial `User` (role: `BUSINESS_ADMIN`).
  - Protected via `x-admin-key` header or Super Admin JWT.

#### [NEW] [tenant.decorator.ts](file:///d:/ProjectsRecent/Factory-flow-dev/apps/backend/src/auth/decorators/tenant.decorator.ts) & Custom Guard
- Create `@CurrentBusinessId()` custom parameter decorator to easily inject the tenant ID into service methods.

#### [NEW] [invoice-settings.module.ts](file:///d:/ProjectsRecent/Factory-flow-dev/apps/backend/src/invoice-settings/invoice-settings.module.ts)
- **`GET /api/invoice-settings`**: Fetches current business invoice settings (or creates default settings if missing).
- **`PATCH /api/invoice-settings`**: Updates company branding, logo, GSTIN, bank details, terms, etc.

#### [MODIFY] Domain Services (`customers`, `products`, `orders`, `inventory`, `dashboard`)
- Update every Prisma query to append `businessId` context (e.g. `where: { id, businessId }`, `data: { ..., businessId }`).
- Scope order sequence numbers or order display IDs per tenant.

---

### Frontend UI & State Layer (`apps/frontend/src`)

#### [MODIFY] [api.ts](file:///d:/ProjectsRecent/Factory-flow-dev/apps/frontend/src/app/utils/api.ts)
- Add user session helpers (`getUser()`, `setUser()`, `clearUser()`).
- Add `invoiceSettingsApi` methods (`get()`, `update()`).
- Add `adminApi` method for Postman/Admin actions.

#### [MODIFY] [Navbar.tsx](file:///d:/ProjectsRecent/Factory-flow-dev/apps/frontend/src/app/components/Navbar.tsx) & [Sidebar.tsx](file:///d:/ProjectsRecent/Factory-flow-dev/apps/frontend/src/app/components/Sidebar.tsx)
- Display the current logged-in Business Name and User Name/Role in the Navbar header.
- Add user logout button and tenant indicator.

#### [MODIFY] [Invoice Section Overhaul]
- Refactor `/invoice` page into a 2-tab navigation container:
  - **Tab 1: Invoice Settings (`InvoiceSettingsTab.tsx`)**:
    - Form to manage Business Logo, Company Name, Tagline, Address, GSTIN, Bank details (Account Number, IFSC, Branch, Bank Name), Terms & Conditions, and Authorized Signature label.
    - Live preview of company header badge.
  - **Tab 2: Generate Invoice (`InvoiceGeneratorTab.tsx`)**:
    - Select Customer & Products, set Discounts & Charges.
    - Upon click of "Preview Invoice", pass saved `InvoiceSettings` to `InvoicePreview` and `InvoiceTemplateClassic`.
- Update [InvoiceTemplateClassic.tsx](file:///d:/ProjectsRecent/Factory-flow-dev/apps/frontend/src/app/pages/InvoiceTemplateClassic.tsx):
  - Replace hardcoded "SIRI ENTERPRISES", address, logo, bank details, and footer text with dynamic properties from `InvoiceSettings`.

---

## Verification Plan

### Automated Tests & Scripts
1. **Prisma Schema & DB Migration**:
   ```bash
   cd apps/backend
   npx prisma migrate dev --name init_multi_tenant_saas
   npx prisma generate
   ```
2. **Build Verification**:
   ```bash
   # Backend build check
   cd apps/backend && npm run build
   # Frontend build check
   cd apps/frontend && npm run build
   ```

### Manual Verification
1. **Postman Tenant Provisioning**:
   - Send `POST /api/admin/tenants` to create **Business A** ("Siri Enterprises") and **Business B** ("GreenLeaf Manufacturing").
2. **Login & Data Isolation Verification**:
   - Log in as Business A admin: Add Customers, Products, and Orders.
   - Log in as Business B admin: Verify that Business B sees 0 customers/products from Business A. Add Business B customers.
   - Log back into Business A: Verify data remains isolated.
3. **Invoice Settings & Layout Customization**:
   - Navigate to `/invoice` -> **Invoice Settings** tab for Business B.
   - Set custom logo URL, GSTIN `29ABCDE1234F1Z5`, custom bank details ("HDFC Bank"), and terms.
   - Switch to **Generate Invoice** tab and click Preview.
   - Verify generated invoice renders Business B's dynamic logo, address, GST, and bank details instead of hardcoded Siri Enterprises layout.
