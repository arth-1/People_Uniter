# Copilot Instructions — MPSTME Community App

This document instructs **GitHub Copilot Pro (Agent / Workspace mode)** to build the full application **step by step**, end‑to‑end.

The app is a **Next.js (App Router) + Supabase + Tailwind** web platform with an existing **ML recommendation system already present in the repository**. Copilot must *read, not reimplement* the ML code and integrate with it.

---

## 0. Ground Rules (Read First)

* Use **Next.js 14+ (App Router)** with **JavaScript** (not TypeScript unless required).
* Use **Tailwind CSS** for all styling.
* Use **Supabase** for auth, database, storage, and edge functions.
* Assume ML models already exist under `/ml/` or similar. **Do NOT retrain or modify ML logic unless explicitly instructed.**
* Prefer **server components**; use client components only when required.
* Every step must be **working, testable, and committed** before moving on.
* Follow clean architecture: `/app`, `/components`, `/lib`, `/services`, `/supabase`, `/ml`.

---

## 1. Project Initialization

### Tasks

1. Initialize Next.js app (App Router).
2. Install and configure:

   * tailwindcss
   * @supabase/supabase-js
   * postcss, autoprefixer
3. Create base folder structure:

```
/app
  /(auth)
  /(dashboard)
/components
/lib
/services
/supabase
/ml   <-- already exists
```

4. Configure environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 2. Database Design & Supabase Setup

### Copilot must create SQL migrations for:

#### Users

* id (uuid, pk)
* auth_user_id
* name
* year
* branch
* bio
* visibility
* created_at

#### Interests

* id
* name
* category

#### User_Interests

* user_id
* interest_id
* weight (float)

#### Groups

* id
* name
* description
* owner_id
* type
* rules
* created_at

#### Group_Members

* group_id
* user_id
* role (admin/member)

#### Events

* id
* group_id
* title
* description
* time

#### Interactions

* user_id
* target_type (user/group/event)
* target_id
* action (view/join/like/attend)
* duration
* created_at

#### Recommendations_Metadata

* user_id
* entity_type
* entity_id
* score
* created_at

#### Embeddings

* entity_type
* entity_id
* vector

### Requirements

* Enable **Row Level Security**.
* Policies must be explicit and minimal.
* Add indexes on foreign keys and embeddings.

---

## 3. Authentication

### Implement

* Supabase email/password auth
* Protected routes using middleware
* Auth layout under `(auth)`

### Pages

* /login
* /signup

### Behavior

* Redirect unauthenticated users
* Auto-create user row on first login

---

## 4. User Profile & Interest Management

### Pages

* /onboarding
* /profile
* /profile/edit

### Features

* Multi-select interests
* Weighted interest sliders
* Skill/hobby editor
* Visibility toggle

### Data

* Persist interests in `User_Interests`
* Track time spent editing/interacting

---

## 5. Group & Community System

### Pages

* /groups
* /groups/create
* /groups/[id]

### Features

* Create / join / leave groups
* Admin moderation
* Member roles
* Activity feed per group

---

## 6. Events System

### Pages

* /events
* /groups/[id]/events/create
* /events/[id]

### Features

* Event discovery
* RSVP tracking
* Link events to groups

---

## 7. Interaction Tracking (Critical for ML)

### Log Automatically

* Profile views
* Group joins/leaves
* Event attendance
* Likes/follows
* Time spent per interest

### Storage

* Store in `Interactions`
* Batch writes where possible

---

## 8. Recommendation & Matching Engine Integration

### IMPORTANT

* Read existing ML code under `/ml`
* Identify exposed functions or APIs

### Implement

* User–User similarity
* User–Group matching
* Diversity injection
* Reinforcement reward hooks

### Flow

1. Collect interaction signals
2. Send to ML inference layer
3. Store results in `Recommendations_Metadata`

---

## 9. Embeddings Infrastructure

### Tasks

* Create text → embedding pipeline
* Store vectors in `Embeddings`
* Implement similarity search

### Notes

* Do NOT train models
* Only call existing embedding logic

---

## 10. API Layer

### Create API routes for:

* Auth
* Users
* Interests
* Groups
* Events
* Recommendations
* Interaction logging

### Rules

* Validate inputs
* Enforce RLS
* No business logic in UI

---

## 11. Frontend Integration

### Pages

* Discover feed
* Recommendation feed
* Notifications

### UX Rules

* Handle empty states
* Loading skeletons
* Optimistic UI where safe

---

## 12. Final Checks
 /
* Ensure ML folder is referenced, not duplicated
* Confirm tracking feeds ML
* No hardcoded secrets
* App must run locally with `npm run dev`

---

## 13. Build Order (Do Not Skip)

1. Auth
2. Database + RLS
3. Onboarding
4. Profiles
5. Groups
6. Events
7. Tracking
8. ML integration
9. Recommendations UI

---

**Copilot: follow this document strictly. Build incrementally. You can improvise architecture wherever needed just make sure that the DB and model things can be collabed properly cz the ml model cant change.**
