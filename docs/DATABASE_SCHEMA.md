# ResellBD Database Schema Documentation

This document provides a high-level overview of the Postgres schema structure powering ResellBD.

## Core Tables

### 1. `profiles`
Extended user data tied to `auth.users`.
- **Primary Key:** `id` (UUID, references `auth.users`)
- **Key Columns:** `full_name`, `avatar_url`, `role` (enum: user, admin), `rating`, `total_reviews`.
- **Triggers:** Auto-created on user sign up.

### 2. `products`
Marketplace listings.
- **Primary Key:** `id` (UUID)
- **Foreign Keys:** `seller_id` (profiles), `category_id` (categories)
- **Key Columns:** `title`, `price`, `status` (active, sold, pending), `division`, `district` (Geospatial hierarchical indexing).
- **AI Fields:** `ai_suggested_price`, `ai_condition`, `risk_score`.

### 3. `orders` & `order_items`
Transactional records between buyers and sellers.
- **Relationships:** `orders.buyer_id` → profiles, `orders.seller_id` → profiles. `order_items` bridges `orders` and `products`.

### 4. `conversations` & `messages`
The realtime chat engine.
- **Relationships:** Conversations link a `buyer_id`, `seller_id`, and optionally a `product_id`. Messages belong to a conversation.

### 5. `subscriptions` & `plans`
Monetization engine for sellers.
- **Plans:** Tiered features (e.g., Free vs Pro).
- **Subscriptions:** Links a user to a plan with `current_period_end`.

## Indexes & Performance Tuning

We employ composite indexes to ensure rapid querying for high-traffic views:
- `idx_products_status_category`: Optimizes the homepage feed.
- `idx_products_status_division_district`: Optimizes location-based searching.
- `idx_messages_convo_read`: Rapidly pulls unread message counts.

## Security: Row Level Security (RLS)

Every table has strict RLS enabled:
- **Products:** Anyone can read `active` products. Only the `seller_id` can update or delete their products.
- **Messages:** Only participants (buyer or seller) in a conversation can read or insert messages into it.
- **Admin Bypass:** Users with `role = 'admin'` possess overarching policies allowing full CRUD on necessary moderation tables.

## RPC Functions
- `db_health_check()`: Returns database connection status.
- `api_health_check()`: Verifies critical table accessibility.
- `increment_views()`: Safely bumps product view counts without race conditions.
