# Expo Management Workspace — Project Brief & Source of Truth

> **Purpose of this document:** This file is the canonical context document for AI coding assistants (including Antigravity). Read it before proposing architecture, changing the data model, creating modules, or implementing features. It captures the product scope, agreed business rules, planned entities, and the intended NestJS structure.
>
> **Project status:** Product concept and MVP scope are locked. The entity list and business rules below are the agreed first-pass domain design. Exact Prisma syntax, database-specific constraints, API route naming, UI design, and a few implementation choices can be finalized during development without changing the product scope.

---

## 1. Product overview

### 1.1 Product name

Working name: **Expo Management Workspace**. The repository/backend folder can use `expo-space-api` unless renamed later.

### 1.2 What the product is

An online collaborative workspace for teams that organize **indoor expos**. It helps an organizing team plan an expo, coordinate responsibilities, manage exhibitors and booth allocations, schedule sessions, communicate in one shared discussion space, and track visitor registrations and overall readiness.

The product is intended primarily for **expo organizers and their internal teams**. It is not intended to be a complete event operating system or a public event-discovery marketplace.

### 1.3 Core product promise

> Give an expo organizing team one shared workspace to plan the event, coordinate people and tasks, manage exhibitors and the agenda, and monitor readiness and visitor registrations.

### 1.4 Product boundaries

- The MVP supports the **Expo** event format only.
- The event takes place indoors.
- An expo may have one or more subject/industry categories.
- A category describes the expo's subject (for example, Technology); it is not a different event format.
- The workspace is private to authenticated team members, except for the public visitor-registration page/link.
- Exhibitors and speakers are records managed by the organizing team. They do not need platform accounts in the MVP.
- Visitors register through a public link and do not need platform accounts.

### 1.5 Supported category seed list

Use these as the initial categories:

- Agriculture
- Technology
- Food & Beverage
- Healthcare
- Education
- Automotive
- Fashion
- Home & Lifestyle
- Business & Startup
- Science
- Arts & Culture

Categories should be stored as reusable records and associated with expos through a many-to-many relationship. Do not create separate event formats from these categories.

---

## 2. Technology direction and architecture

### 2.1 Planned stack

- **Frontend:** Next.js
- **Backend:** NestJS with TypeScript
- **ORM:** Prisma
- **Database:** Relational database accessed through Prisma. The exact database provider is not locked in this brief; do not assume one without confirmation.
- **Backend architecture:** Feature-oriented modular monolith. One NestJS application; no microservices for the MVP.
- **Authentication baseline:** Email/username and password with token-based authentication. JWT is the proposed baseline; finalize token lifetime, refresh-token storage, and cookie/header delivery before implementation.

### 2.2 Architecture principles

1. Keep business logic in the backend. Frontend visibility rules are for user experience, never the security boundary.
2. Organize the NestJS code by business feature, not one module per database table.
3. Keep authentication separate from expo-specific authorization and roles.
4. Use Prisma for persistence and database relationships. Use DTOs for HTTP input validation and API contracts.
5. Do not introduce unnecessary abstractions, repositories, empty folders, or microservices. Add structure when actual complexity requires it.
6. Avoid circular module dependencies. A feature module should expose only the providers another module genuinely needs.
7. Dashboard and activity views aggregate existing domain data; they must not become competing sources of truth.
8. Use database transactions for workflows that must succeed or fail together.

---

## 3. MVP features — included and locked

### 3.1 Expo creation and workspace

- An authenticated user can create an expo.
- The creator automatically becomes an **Admin** of that expo.
- Expo details include name, slug, description, dates, venue, optional capacity, cover image, status, categories, and visitor-registration settings.
- Each expo has its own workspace and team membership.
- The dashboard summarizes relevant expo information, operational progress, and recent activity.

### 3.2 Team management

- Users can invite existing registered platform users to an expo.
- An invitation is accepted or declined by the invited user.
- Accepting an invitation creates or reactivates an expo membership with the **Member** role by default.
- An Admin can invite users, revoke pending invitations, and change team roles.
- The Admin can promote a Member to Manager (and change roles subject to the role-management safeguards below).
- Multiple Admins are allowed.
- Roles are scoped to an expo, not to the global user account.

### 3.3 Lightweight task management

- Create and manage tasks within an expo.
- Assign tasks to active expo members.
- Support two task types:
  - **Checklist:** progress is derived from checklist-item completion.
  - **Progress:** progress is a numeric value from 0 to 100.
- Include priority, status, optional deadline, description, creator, and assignee.
- Support task comments.
- Members can update tasks assigned to them and comment, within the agreed access rules.

### 3.4 Shared team discussion

- One shared discussion channel per expo.
- Active members can read and post messages.
- Messages are associated with their sender and expo.
- No direct messages, multiple channels, group chat, voice/video, or file attachments in the MVP.

### 3.5 Exhibitors, showcase zones, booths, and allocations

- Organizers can manually create exhibitor records.
- Organizers can create showcase zones and booths within zones.
- Organizers can allocate a booth to an exhibitor and release/reassign allocations.
- An exhibitor does not need a platform account.
- Support exhibitor status such as Invited, Confirmed, and Withdrawn.
- Booth allocation conflicts must be prevented by backend business rules and transaction-safe persistence.

### 3.6 Agenda, stages, sessions, and speakers

- Organizers can create stages within an expo.
- Organizers can create sessions on stages with start/end times, type, description, and status.
- Organizers can manually create speaker records and assign speakers to sessions.
- Speakers do not need platform accounts.
- Scheduled sessions on the same stage must not overlap.
- Presenter/speaker overlaps can be surfaced as warnings in the MVP; they do not necessarily block scheduling.

### 3.7 Public visitor registration

- Each published expo can expose a shareable public registration link when registration is enabled.
- Visitors submit a registration form without creating a platform account or signing in.
- The organizing team can view and manage registrations in the private workspace.
- Public endpoints must never expose the private workspace or other visitors' personal records.
- Keep visitor registration separate from authenticated platform-user accounts.

### 3.8 Dashboard and recent activity

- Dashboard data is aggregated from the other modules.
- Show useful counts/status summaries such as tasks, exhibitors, booth allocations, sessions, and visitor registrations.
- Show a lightweight recent activity feed.
- Activity is for workspace context, not a full compliance/audit-log product.

---

## 4. Explicitly out of scope for the MVP

Do not implement these unless the product scope is explicitly changed:

- Payments, invoices, paid ticketing, or payment gateway integration.
- Sponsor packages, sponsorship billing, or sponsor self-service portals.
- Visitor CRM, attendee networking, matchmaking, or visitor-to-exhibitor messaging.
- QR ticket generation and advanced check-in flows. A basic attendance status field may exist in the model, but a sophisticated ticket/check-in product is not part of the MVP.
- Direct messages, multiple discussion channels, group chat, voice calls, or video calls.
- File attachments in discussions or task comments.
- Advanced drag-and-drop floor-plan editor or interactive 3D venue maps.
- Public self-service exhibitor applications or exhibitor accounts.
- Speaker accounts or speaker self-service portals.
- Advanced analytics, BI, or a complex reporting engine.
- Event discovery marketplace, public social feed, or multi-format event support.

If a request appears to require an out-of-scope feature, explain the scope conflict and ask whether the project scope is being changed before building it.

---

## 5. Roles, membership, and authorization

### 5.1 Global identity vs expo role

A `User` is a platform identity. A user does **not** have one global expo role.

A user's role is stored on their `ExpoMembership`, because the same person can be:

- Admin in Expo A
- Manager in Expo B
- Member in Expo C

Never put `Admin`, `Manager`, or `Member` as a global role field on `User`.

### 5.2 Roles

#### Admin

- Full control of the expo workspace.
- Manage expo details, publication/status, categories, and registration settings.
- Invite users, revoke invitations, and manage memberships and roles.
- Manage all operational modules: tasks, discussion, exhibitors, zones, booths, allocations, agenda, speakers, and visitor registrations.
- Multiple Admins are allowed.

#### Manager

- Manages operational modules: tasks, exhibitors, zones, booths, allocations, agenda, speakers, and visitor registrations.
- Can coordinate work and manage operational records.
- Does not automatically receive Admin-only team/role management or ownership-level controls.

#### Member

- Can view the workspace and its relevant information.
- Can participate in the shared discussion.
- Can update tasks assigned to them and add task comments, subject to task rules.
- Can view exhibitor, booth, agenda, and visitor-registration information according to the MVP's workspace visibility policy.
- Cannot manage team roles or perform Admin/Manager-only operational changes by default.

### 5.3 Role assignment rules

1. Signup creates a `User` only. It does not assign an expo role.
2. When a user creates an expo, the Expos feature creates the expo and an `ExpoMembership` for the creator with `Admin` role in the **same database transaction**.
3. When an invitee accepts an invitation, the Team feature creates/reactivates their membership with `Member` role by default.
4. An Admin can change a member's role to `Manager` (and manage roles according to the safeguards below).
5. A client must never be allowed to choose their own role in signup, expo creation, or invitation acceptance payloads. The backend determines the role.
6. Membership status is separate from role. A removed user must not regain access merely because a membership row still exists.

### 5.4 Authorization rules — mandatory

For every private expo request, the backend must verify:

1. The requester is authenticated.
2. The requester has an **Active** membership in the specific expo.
3. Their expo role permits the requested action.
4. The target resource belongs to the same expo (or is otherwise linked to it correctly).
5. Any resource-specific business rules are satisfied.

Examples:

- A task assignee must be an active member of the task's expo.
- A session's stage must belong to the same expo as the session.
- An exhibitor and booth must belong to the same expo before allocation.
- An invitation must belong to the expo and be acted on by the intended invitee (or revoked by an authorized Admin).

`@Roles()` metadata/decorators may declare role requirements, but role metadata alone is not sufficient. Membership and resource ownership must also be checked. Hiding a button in the frontend is not authorization.

### 5.5 Admin safeguards

- Multiple Admins are allowed.
- Prevent removing or demoting the **last active Admin** of an expo.
- Role changes and membership removals must be authorized by an Admin.
- Consider making the creator's initial Admin membership protected from accidental removal until another Admin exists; implement the final policy consistently.

---

## 6. Authentication and user identity

### 6.1 Auth module responsibilities

The Auth module handles identity verification and session/token mechanics, not expo roles.

MVP auth responsibilities:

- Signup/registration.
- Login.
- Password hashing and password verification.
- Issuing and validating authentication tokens.
- A protected endpoint such as `GET /auth/me` to return the current authenticated user's safe profile.
- Logout/token invalidation as supported by the chosen token strategy.

The Auth module must not:

- Assign Admin, Manager, or Member roles.
- Create expo memberships during ordinary signup.
- Decide whether a user may manage a particular expo's tasks, exhibitors, or agenda.

Those responsibilities belong to Expos and Team modules respectively.

### 6.2 User model decision

The current agreed baseline is:

```prisma
model User {
  id           String   @id @default(cuid())
  username     String   @unique
  email        String   @unique
  passwordHash String
  displayName  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

Notes:

- `displayName` is optional. If it is absent, display `username` in the UI.
- Example fallback: `user.displayName ?? user.username`.
- `username` is unique and is used as the account handle.
- `email` is unique and is used for login/account communication.
- `passwordHash` stores only a secure password hash, never a plain-text password.
- Optional profile fields such as `profileImageUrl` and `bio` may be added when profile functionality is implemented; they are not required for the initial signup/login flow.
- Consider case-insensitive uniqueness/normalization for username and email. Prisma's `@unique` behavior depends on the chosen database and collation; do not assume it automatically enforces the desired case-insensitive policy.

### 6.3 DTOs and Prisma are different

Use DTOs for incoming HTTP request contracts and runtime validation. Use Prisma models/types for database structure and persistence.

Example:

- `SignupDto` accepts `username`, `email`, `password`, and optional `displayName`.
- It must not accept `id`, `passwordHash`, global expo role, or timestamps.
- Auth service hashes `password` and persists the hash as `passwordHash` through Prisma.
- API responses must never expose `passwordHash`.

Use NestJS validation (for example, `class-validator` with `ValidationPipe`) on request DTOs. TypeScript interfaces/types and Prisma generated types alone do not validate untrusted HTTP request bodies at runtime.

---

## 7. Domain data model — planned entity dictionary

This is the agreed first-pass conceptual model. Implement relationships and constraints carefully in Prisma. Do not add global user roles. Use consistent IDs and timestamps. Exact enum names and database-specific indexes can be finalized during schema implementation while preserving the stated behavior.

### 7.1 Identity and workspace

#### `User`

- `id`
- `username` — unique account handle
- `email` — unique email
- `passwordHash`
- `displayName` — optional; UI falls back to username
- `profileImageUrl` — optional future/profile field
- `bio` — optional future/profile field
- `createdAt`, `updatedAt`

Relationships: memberships, invitations sent/received, tasks created/assigned, task comments, discussion messages, and other actor/creator relations as appropriate.

#### `Expo`

- `id`
- `createdById` — creator user
- `name`
- `slug` — unique public/workspace identifier
- `description` — optional
- `coverImageUrl` — optional
- `startAt`, `endAt`
- `venueName`, `venueAddress`
- `capacity` — optional
- `status` — `Draft`, `Published`, `Ongoing`, `Completed`, `Cancelled`
- `registrationEnabled`
- `registrationDeadline` — optional
- `createdAt`, `updatedAt`

Rules: `endAt` must be after `startAt`; categories are many-to-many through `ExpoCategory`; the creator receives an Admin membership atomically with expo creation.

#### `ExpoMembership`

- `id`
- `expoId`
- `userId`
- `role` — `Admin`, `Manager`, `Member`
- `status` — `Active`, `Removed`
- `joinedAt`
- `removedAt` — optional

Constraints/rules: unique `(expoId, userId)`; role is scoped to the expo; removed members lose access; rejoining can reactivate the existing membership. Preserve membership history rather than casually deleting rows.

#### `Invitation`

- `id`
- `expoId`
- `inviterUserId`
- `inviteeUserId`
- `status` — `Pending`, `Accepted`, `Declined`, `Revoked`
- `createdAt`
- `respondedAt` — optional
- `revokedAt` — optional

Rules: invitee is an existing registered platform user; inviter must be an Admin; only the intended invitee can accept/decline; an Admin can revoke a pending invitation; prevent duplicate pending invitations; accepting creates/reactivates a `Member` membership atomically.

### 7.2 Tasks and communication

#### `Task`

- `id`
- `expoId`
- `createdById`
- `assigneeId` — optional if unassigned tasks are allowed
- `title`
- `description` — optional
- `type` — `Checklist`, `Progress`
- `priority` — `Low`, `Medium`, `High`
- `status` — `ToDo`, `InProgress`, `Completed`
- `progress` — optional/conditional for Progress tasks (0–100)
- `deadline` — optional
- `createdAt`, `updatedAt`

Rules: creator and assignee must be active members of the same expo; Checklist progress is computed from checklist items; Progress tasks use a numeric 0–100 value; do not allow contradictory task-type data.

#### `TaskChecklistItem`

- `id`
- `taskId`
- `title`
- `isCompleted`
- `position`
- `completedById` — optional
- `completedAt` — optional

Rules: only Checklist tasks can have checklist items; completion metadata should be set/cleared consistently; checklist items are deleted with their task.

#### `TaskComment`

- `id`
- `taskId`
- `authorId`
- `content`
- `createdAt`, `updatedAt`

Rules: author must be an active member with access to the task. Apply the task access policy consistently.

#### `DiscussionMessage`

- `id`
- `expoId`
- `senderId`
- `content`
- `createdAt`
- `updatedAt` — optional

Rules: one shared discussion stream per expo (no separate Channel entity for the MVP); only active members can read/post; removed members lose future access; historic messages remain retained.

### 7.3 Exhibitors, zones, booths, allocations

#### `Exhibitor`

- `id`
- `expoId`
- `companyName`
- `contactName`
- `contactEmail`
- `contactPhone` — optional
- `description` — optional
- `category` — optional text/category descriptor unless a normalized exhibitor category model is later justified
- `websiteUrl` — optional
- `status` — `Invited`, `Confirmed`, `Withdrawn`
- `createdAt`, `updatedAt`

Rules: manually managed by the organizing team; no exhibitor login/account required.

#### `ShowcaseZone`

- `id`
- `expoId`
- `name`
- `description` — optional
- `position` — optional display/sort value
- `createdAt`, `updatedAt`

Rules: zone name should be unique within an expo, preferably case-insensitively.

#### `Booth`

- `id`
- `zoneId`
- `boothCode`
- `description` — optional
- `sizeDescription` — optional
- `status` — `Available`, `Reserved`, `Unavailable`
- `createdAt`, `updatedAt`

Rules: booth code is unique within a zone; its expo is derived through `zoneId`.

#### `BoothAllocation`

- `id`
- `boothId`
- `exhibitorId`
- `allocatedById`
- `status` — `Active`, `Released`
- `allocatedAt`
- `releasedAt` — optional

Rules: booth and exhibitor must belong to the same expo; only one active allocation per booth; MVP assumes one active booth per exhibitor; release an old allocation before reassignment; enforce conflict prevention transaction-safely. Expo can be derived through booth → zone; avoid redundant `expoId` unless a justified query/integrity need appears.

### 7.4 Agenda and speakers

#### `Stage`

- `id`
- `expoId`
- `name`
- `description` — optional
- `capacity` — optional
- `createdAt`, `updatedAt`

Rules: stage name is unique within an expo.

#### `Session`

- `id`
- `expoId`
- `stageId`
- `createdById`
- `title`
- `description` — optional
- `type` — `Presentation`, `Speech`, `Panel`, `Demonstration`
- `startAt`, `endAt`
- `status` — `Scheduled`, `Cancelled`, `Completed`
- `createdAt`, `updatedAt`

Rules: stage and session must belong to the same expo; session times must be within expo dates; `endAt` must be after `startAt`; scheduled sessions on the same stage must not overlap. Speaker overlaps are warnings in the MVP, not necessarily blockers.

#### `Speaker`

- `id`
- `expoId`
- `name`
- `organization` — optional
- `roleTitle` — optional
- `bio` — optional
- `email` — optional
- `profileImageUrl` — optional
- `createdAt`, `updatedAt`

Rules: manually managed speaker records; no platform account required.

#### `SessionParticipant`

- `id`
- `sessionId`
- `speakerId`
- `participantRole` — `Presenter`, `Panelist`, `Moderator`
- `createdAt`

Rules: unique `(sessionId, speakerId)`; session and speaker must belong to the same expo.

### 7.5 Visitors, categories, activity

#### `VisitorRegistration`

- `id`
- `expoId`
- `fullName`
- `email`
- `phone` — optional
- `organization` — optional
- `visitorType` — optional
- `registrationStatus` — `Registered`, `Cancelled`
- `attendanceStatus` — `NotCheckedIn`, `CheckedIn`
- `registeredAt`
- `checkedInAt` — optional

Rules: no platform account required; public registration is only allowed when expo registration is enabled and within any configured deadline; normalize email and prevent duplicate active registrations per expo; cancelled visitors cannot be checked in; public endpoints cannot fetch other visitor records. A database-specific partial/filtered uniqueness strategy may be needed to enforce uniqueness only among active registrations.

#### `Category`

- `id`
- `name`
- `slug`

Rules: reusable seeded category records.

#### `ExpoCategory`

- `expoId`
- `categoryId`

Rules: unique `(expoId, categoryId)`; join table for many-to-many expo/category relationship.

#### `ExpoActivity`

- `id`
- `expoId`
- `actorUserId` — optional (some system actions may have no user actor)
- `action`
- `entityType`
- `entityId` — optional
- `summary`
- `createdAt`

Rules: create from trusted backend operations; lightweight recent activity feed only, not a full immutable audit/compliance system.

---

## 8. Important relationships at a glance

- `User` ↔ `Expo` is many-to-many through `ExpoMembership`.
- `Expo` ↔ `Category` is many-to-many through `ExpoCategory`.
- `Expo` has many `Invitation`, `Task`, `DiscussionMessage`, `Exhibitor`, `ShowcaseZone`, `Stage`, `Session`, `Speaker`, `VisitorRegistration`, and `ExpoActivity` records.
- `ShowcaseZone` has many `Booth` records.
- `Booth` and `Exhibitor` are connected through `BoothAllocation` history.
- `Stage` has many `Session` records.
- `Session` ↔ `Speaker` is many-to-many through `SessionParticipant`.
- `Task` has many `TaskChecklistItem` and `TaskComment` records.

Avoid duplicating relationship data without a clear reason. Validate cross-expo consistency in services and, where practical, database constraints.

---

## 9. Deletion, retention, and lifecycle rules

Use deliberate lifecycle transitions rather than deleting records that have operational history.

- **User/account deletion:** must be deliberate; do not break expo ownership, memberships, invitations, task history, comments, or activity. Define anonymization/transfer policy before implementing account deletion.
- **Expo deletion:** Admin-only, explicit confirmation, and a deliberate retention policy. Do not cascade-delete an entire expo's operational history accidentally.
- **Membership removal:** mark membership `Removed`; preserve history.
- **Invitation:** preserve status history (`Accepted`, `Declined`, `Revoked`) rather than deleting invitations casually.
- **Task deletion:** authorized deletion may cascade checklist items/comments, subject to the chosen retention behavior.
- **Zone deletion:** block while it contains actively allocated booths; require allocations to be released or booths handled first.
- **Booth deletion:** block while actively allocated.
- **Booth allocations:** release rather than erase; preserve allocation history.
- **Sessions:** prefer marking `Cancelled` over deleting scheduled sessions.
- **Speakers:** prevent deletion while assigned to sessions, or explicitly remove assignments first.
- **Visitor registrations:** cancel or anonymize according to the eventual retention/privacy policy; do not expose personal data publicly.
- **Activity:** retain for the lifetime of the expo subject to the chosen expo retention policy.

Do not invent legal retention periods. Add a clear policy decision before implementing account/visitor data deletion workflows.

---

## 10. Planned NestJS backend folder structure

Use a feature-based modular monolith. The structure below is the agreed starting point, not a requirement to create empty files/folders before they are needed.

```text
expo-space-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── configuration.ts
│   │   └── env.validation.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── expo-access.guard.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   ├── enums/
│   │   └── utils/
│   ├── database/
│   │   ├── database.module.ts
│   │   └── prisma.service.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── expos/
│   │   ├── team/
│   │   ├── tasks/
│   │   ├── discussions/
│   │   ├── exhibitors/
│   │   ├── agenda/
│   │   ├── registrations/
│   │   ├── dashboard/
│   │   └── activity/
│   └── app.controller.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/
├── .env.example
├── .gitignore
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

### 10.1 Feature module ownership

| Module | Owns |
|---|---|
| `auth` | Signup, login, password handling, token/session validation, current identity |
| `users` | User profile and username lookup/search |
| `expos` | Expo creation/editing, categories, status/publication, expo detail/settings; creates creator's initial Admin membership as part of expo creation workflow |
| `team` | Expo memberships, invitations, role changes, removal/reactivation |
| `tasks` | Tasks, checklist items, task comments |
| `discussions` | One shared discussion stream per expo |
| `exhibitors` | Exhibitor records, zones, booths, allocations |
| `agenda` | Stages, sessions, speakers, session participants |
| `registrations` | Public registration endpoint/link, visitor records, registration/attendance management |
| `dashboard` | Aggregated workspace overview and summary queries; does not own duplicate domain records |
| `activity` | Activity-feed records and feed queries |

### 10.2 Typical feature layout

Start simple. Add specialized folders only when useful.

```text
modules/tasks/
├── tasks.module.ts
├── tasks.controller.ts
├── tasks.service.ts
└── dto/
    ├── create-task.dto.ts
    ├── update-task.dto.ts
    ├── query-tasks.dto.ts
    ├── create-checklist-item.dto.ts
    └── update-checklist-item.dto.ts
```

The same basic pattern can be used for other feature modules. There is no requirement to create repository classes by default; Prisma calls from a feature service are acceptable initially. Keep business rules inside the owning feature (for example, booth allocation rules belong in `exhibitors`, not in a global guard).

### 10.3 Shared infrastructure

- `common/` is for reusable cross-feature code only: decorators, guards, filters, pipes, enums, and utilities.
- `database/` owns Prisma connection/service lifecycle and exports the database service intentionally.
- `config/` owns validated environment configuration.
- `AppModule` composes modules; it should not become a home for business logic.

---

## 11. DTO, validation, service, and response conventions

- Use a DTO for each meaningful incoming HTTP request shape (for example `SignupDto`, `LoginDto`, `CreateExpoDto`, `AcceptInvitationDto`).
- DTOs are API input contracts and runtime validation boundaries; Prisma models define persistence. They are not substitutes for each other.
- Never use a Prisma model as an unchecked HTTP request body.
- Use NestJS `ValidationPipe` with appropriate whitelist/transform settings. Reject unexpected fields where practical.
- Never accept protected fields from clients: `id`, `createdAt`, `updatedAt`, `passwordHash`, membership role, actor/creator IDs when derived from the logged-in user, or system-managed statuses.
- Derive the acting user from the authenticated request, not from a user ID supplied in the body.
- Services enforce business rules and access checks, then call Prisma.
- Return explicit safe response shapes. Never return `passwordHash`, refresh-token secrets, or internal authentication material.
- Normalize/validate email, username, slug, URLs, date ranges, and numeric bounds at appropriate boundaries.
- Treat all client input as untrusted, even when TypeScript types appear correct.

---

## 12. Key business workflows

### 12.1 Signup and login

1. Client submits signup data (`username`, `email`, `password`, optional `displayName`).
2. `SignupDto` validates the request.
3. Auth service normalizes/checks identity fields and hashes the password.
4. Prisma creates the `User` record.
5. Response returns safe user data and the selected authentication/session result; never the password/hash.
6. Login validates credentials and issues the configured token/session.
7. Auth guard validates protected requests and attaches the authenticated user identity.
8. `GET /auth/me` returns the current safe profile.
9. No expo role or membership is created by signup/login.

### 12.2 Create expo

1. Authenticated user submits expo details.
2. Expos service validates data and category selections.
3. In one Prisma transaction, create the `Expo` and creator's `ExpoMembership` with `Admin` role and `Active` status.
4. Return expo details and the creator's membership/role as appropriate.

### 12.3 Invite and accept invitation

1. Admin selects an existing registered user to invite.
2. Team service verifies inviter is an active Admin in the expo.
3. Create a pending invitation; prevent duplicate pending invitation.
4. The intended invitee accepts or declines.
5. On acceptance, use a transaction to update invitation status and create/reactivate an Active `ExpoMembership` with `Member` role.
6. Do not accept a requested role from the client.

### 12.4 Change a team role

1. Authenticated requester targets a membership within an expo.
2. Verify active Admin membership and target membership belongs to the same expo.
3. Apply permitted role transition.
4. Prevent demotion/removal of the last active Admin.
5. Record an activity entry where appropriate.

### 12.5 Public visitor registration

1. Visitor opens the expo's public registration link.
2. Backend verifies expo is published, registration is enabled, and deadline/capacity rules permit registration.
3. Validate visitor form data.
4. Normalize email and prevent duplicate active registration for that expo.
5. Create visitor registration.
6. Public response confirms the result only; it must not return the expo's private registration list or other visitors' information.

---

## 13. Suggested implementation sequence

Build in small, testable vertical slices. Do not implement all modules at once.

### Phase 1 — Foundation and authentication

1. Create the NestJS project and establish config/environment validation.
2. Set up Prisma and the database service/module.
3. Implement the initial `User` model and migration.
4. Implement signup, login, password hashing, token strategy, auth guard, and `GET /auth/me`.
5. Add validation and safe response handling.
6. Test duplicate username/email, invalid credentials, missing/invalid tokens, and password-hash non-disclosure.

### Phase 2 — Expo and team foundation

1. Implement Category seed data and expo/category relationships.
2. Implement expo creation with transactional creator Admin membership.
3. Implement expo detail/update and membership-aware access.
4. Implement invitation creation, acceptance, decline, and revocation.
5. Implement role changes and last-Admin safeguards.

### Phase 3 — Operational workspace

1. Tasks, checklist items, task comments.
2. Shared discussion.
3. Exhibitors, zones, booths, allocations.
4. Stages, sessions, speakers, session participants.

### Phase 4 — Visitor registration and overview

1. Public visitor registration link and form API.
2. Private visitor management.
3. Dashboard aggregation.
4. Recent activity feed.

### Phase 5 — Integration, testing, and polish

- Verify role and tenant isolation across every module.
- Test cross-expo resource access attempts.
- Test concurrency-sensitive booth allocations and invitation acceptance.
- Test session overlap validation.
- Review data privacy, retention, and deletion behavior.
- Add integration/e2e tests for end-to-end workflows.

**First end-to-end milestone:** Register → Sign in → Create expo → Creator becomes Admin → Invite another registered user → Invitee accepts → Invitee gets Member role → Access is enforced according to role.

---

## 14. Quality, security, and consistency requirements

These apply to all implementations:

- Enforce authentication and expo authorization on the server.
- Never trust client-supplied role, creator ID, sender ID, allocation actor ID, or other identity/ownership fields.
- Every expo-scoped query must be scoped to the requested expo and authorized membership.
- Validate that related records belong to the same expo before connecting them.
- Use transactions for multi-record state changes (expo + creator membership; invitation + membership; allocation release + new allocation).
- Prevent race conditions for unique active booth allocation and other concurrency-sensitive rules with suitable database constraints/transactions.
- Do not expose private visitor data through public endpoints.
- Do not return password hashes or secrets.
- Use explicit validation and safe error responses; do not leak internal stack traces or secrets.
- Keep timestamps consistent and store/compare event times with a clearly chosen timezone strategy. The exact timezone handling implementation should be decided before agenda APIs are finalized.
- Add tests for both successful actions and forbidden actions; authorization tests are essential, not optional polish.

---

## 15. Guidelines for AI coding assistants

When working in this repository, follow these instructions:

1. **Read this document first** before making changes. Treat it as the product source of truth.
2. Do not silently change the locked MVP scope, roles, role-assignment ownership, or business rules.
3. Do not add out-of-scope features as “helpful extras.” Explain scope conflicts and request approval before expanding scope.
4. Do not invent missing product decisions. Call out unresolved choices and propose a small number of options when they block implementation.
5. Preserve the separation of concerns:
   - Auth = authentication/identity verification.
   - Expos = expo creation/details and initial creator Admin membership.
   - Team = invitations, memberships, and expo role management.
   - Other feature modules = their own domain logic and business constraints.
6. Do not add a global role to `User`.
7. Do not allow clients to submit their own role or trusted actor IDs.
8. Use DTOs for HTTP input validation and Prisma for persistence; do not confuse their responsibilities.
9. Keep the architecture simple and feature-based. Do not create microservices or unnecessary repository/abstraction layers.
10. Before adding a model, field, enum, module, package, or feature, explain why it is required and whether it is already covered by this document.
11. When a schema change is needed, explain relationship/cardinality and deletion behavior, then update Prisma schema and migration consistently.
12. When implementing a feature, include authorization checks and tests for unauthorized/cross-expo access.
13. Prefer complete, working vertical slices over generating many empty files.
14. Do not overwrite existing code or configuration without inspecting it first. Adapt to the actual repository state.
15. At the end of a task, report files changed, behavior implemented, validation/tests run, and any unresolved decisions.

### 15.1 How to treat this document

- **Locked:** product purpose, indoor Expo-only MVP, included/out-of-scope feature lists, role definitions, role ownership/assignment rules, and core domain constraints.
- **Baseline design:** entity dictionary and proposed NestJS folder layout. Preserve their intent; refine exact implementation details where needed.
- **Not yet fixed:** database provider, exact auth token/refresh strategy, UI design system, API route naming, exact database-specific indexes, deployment provider, and legal data-retention periods.

If the repository's existing implementation conflicts with this file, do not blindly rewrite it. Explain the conflict and suggest the smallest safe change that brings the code back into alignment.

---

## 16. Current next task

The immediate development task is to start with the **Auth feature**:

- Finalize the initial Prisma `User` model (including optional `displayName`).
- Set up DTO-based signup and login request validation.
- Implement password hashing and credential verification.
- Implement the selected JWT/token strategy and protected route guard.
- Implement `GET /auth/me`.
- Keep expo roles and memberships out of Auth.

Once Auth is working, proceed to the Expos and Team modules for expo-specific membership creation and role assignment.

---

**End of project brief.**
