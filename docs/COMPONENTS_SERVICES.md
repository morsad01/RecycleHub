# UI Components and Services Guide

ResellBD maintains a custom suite of reusable UI components and abstracted service layers.

## Reusable UI Components (`src/components/ui/`)

### `Button`
A highly flexible button component supporting `variant` (primary, secondary, outline, ghost) and `size` (sm, md, lg) props. Automatically handles loading states with a spinner.

### `Input` & `TextArea`
Accessible form controls with built-in error message display capabilities and seamless `react-hook-form` integration.

### `Modal`
An accessible overlay component utilizing a portal to render at the top of the DOM. Supports a backdrop blur and smooth entrance animations.

### `LocationPicker` (`src/features/maps/`)
A hierarchical dropdown system (Division → District → Upazila) integrated with React Leaflet to drop a visual pin on the user's coordinates.

## Core Services (`src/features/*/services/`)

### `PaymentGateway` (`src/features/payments/`)
An abstracted strategy pattern supporting:
- **bKash, Nagad, Rocket, SSLCommerz** for local BD transactions.
- **Stripe** for international clearing.
- **COD** for manual fulfillment.

### `DeliveryGateway` (`src/features/delivery/`)
Manages courier tracking and routing.
- Supports **Pathao** and **RedX** tracking IDs.

### `AdService` (`src/features/ads/`)
Logs impressions and clicks for sponsored listings. Integrates deeply with the `HomepageBanner` component.

### `SubscriptionService` (`src/features/monetization/`)
Determines a seller's capability boundaries (e.g., active product limits, AI usage limits) based on their current `PlanType` (Free, Basic, Pro, Enterprise).
