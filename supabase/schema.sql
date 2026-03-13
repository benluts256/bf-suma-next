-- ═══════════════════════════════════════════════════════════════════════════════
-- BF SUMA NEXUS — PRODUCTION DATABASE SCHEMA
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Enable required extensions ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Custom types ──────────────────────────────────────────────────────────────
DO $$ BEGIN
   CREATE TYPE app_role AS ENUM ('manager', 'distributor', 'client');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('text', 'image', 'system');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'login', 'logout', 'signup',
    'order_created', 'order_updated', 'order_completed',
    'client_assigned', 'client_removed',
    'location_updated', 'message_sent',
    'subscription_created', 'subscription_updated', 'subscription_canceled',
    'profile_updated', 'settings_changed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. PROFILES — Unified user profiles linked to auth.users
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id  UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role          app_role NOT NULL DEFAULT 'client',
  full_name     TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. DISTRIBUTORS — Extended distributor data
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS distributors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  distributor_code TEXT UNIQUE NOT NULL,
  rank            TEXT NOT NULL DEFAULT 'Bronze',
  rank_points     INTEGER NOT NULL DEFAULT 0,
  total_sales     DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.15,
  region          TEXT,
  is_verified     BOOLEAN NOT NULL DEFAULT false,
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_distributors_profile ON distributors(profile_id);
CREATE INDEX IF NOT EXISTS idx_distributors_code ON distributors(distributor_code);
CREATE INDEX IF NOT EXISTS idx_distributors_region ON distributors(region);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. CLIENTS — Extended client data
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  distributor_id  UUID REFERENCES distributors(id) ON DELETE SET NULL,
  shipping_address TEXT,
  total_orders    INTEGER NOT NULL DEFAULT 0,
  total_spent     DECIMAL(12,2) NOT NULL DEFAULT 0,
  last_order_at   TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_profile ON clients(profile_id);
CREATE INDEX IF NOT EXISTS idx_clients_distributor ON clients(distributor_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. CLIENT_INVITES — Client invitation system
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS client_invites (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distributor_id  UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  token           TEXT UNIQUE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at     TIMESTAMPTZ,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_invites_distributor ON client_invites(distributor_id);
CREATE INDEX IF NOT EXISTS idx_client_invites_email ON client_invites(email);
CREATE INDEX IF NOT EXISTS idx_client_invites_token ON client_invites(token);
CREATE INDEX IF NOT EXISTS idx_client_invites_status ON client_invites(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. MESSAGES — Real-time messaging between users
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  message_type  message_type NOT NULL DEFAULT 'text',
  is_read       BOOLEAN NOT NULL DEFAULT false,
  read_at       TIMESTAMPTZ,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. ACTIVITY_LOGS — Comprehensive activity tracking
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS activity_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  activity      activity_type NOT NULL,
  description   TEXT,
  metadata      JSONB DEFAULT '{}',
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity ON activity_logs(activity);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. DISTRIBUTOR_LOCATIONS — GPS tracking for distributors
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS distributor_locations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distributor_id  UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  latitude        DECIMAL(10,8) NOT NULL,
  longitude       DECIMAL(11,8) NOT NULL,
  accuracy        DECIMAL(8,2),
  heading         DECIMAL(5,2),
  speed           DECIMAL(8,2),
  is_online       BOOLEAN NOT NULL DEFAULT true,
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dist_locations_distributor ON distributor_locations(distributor_id);
CREATE INDEX IF NOT EXISTS idx_dist_locations_online ON distributor_locations(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_dist_locations_last_seen ON distributor_locations(last_seen_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. NOTIFICATIONS — In-app notification system
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info',
  is_read     BOOLEAN NOT NULL DEFAULT false,
  action_url  TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. ORDERS — Order tracking
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  distributor_id      UUID REFERENCES distributors(id) ON DELETE SET NULL,
  status              TEXT NOT NULL DEFAULT 'pending',
  total_amount        DECIMAL(12,2) NOT NULL DEFAULT 0,
  items_count         INTEGER NOT NULL DEFAULT 0,
  shipping_address    TEXT,
  estimated_delivery  TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  notes               TEXT,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_distributor ON orders(distributor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. PRODUCTS — Sellable items (minimal catalog)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku           TEXT UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  price_ugx     DECIMAL(12,2) NOT NULL CHECK (price_ugx >= 0),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. INVENTORY — Stock for products (single-warehouse model)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS inventory (
  product_id    UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  available     INTEGER NOT NULL DEFAULT 0 CHECK (available >= 0),
  reserved      INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_available ON inventory(available);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 12. ORDER_ITEMS — Line items per order
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_ugx DECIMAL(12,2) NOT NULL CHECK (unit_price_ugx >= 0),
  line_total_ugx DECIMAL(12,2) NOT NULL CHECK (line_total_ugx >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION — Atomic checkout (prevents oversell)
--   Strategy: conditional UPDATE inventory WHERE available >= qty per item.
--   If any item can't be fulfilled, raise exception => whole transaction rolls back.
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION create_order_atomic(
  _client_id UUID,
  _shipping_address TEXT,
  _items JSONB
)
RETURNS UUID AS $$
DECLARE
  _order_id UUID;
  _row JSONB;
  _product_id UUID;
  _qty INTEGER;
  _unit_price DECIMAL(12,2);
  _line_total DECIMAL(12,2);
  _items_count INTEGER := 0;
  _total DECIMAL(12,2) := 0;
BEGIN
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'No items provided';
  END IF;

  -- Create base order row
  INSERT INTO orders (client_id, status, shipping_address)
  VALUES (_client_id, 'pending', NULLIF(_shipping_address, ''))
  RETURNING id INTO _order_id;

  -- Process each item with atomic stock decrement
  FOR _row IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _product_id := (_row->>'product_id')::UUID;
    _qty := (_row->>'quantity')::INTEGER;

    IF _product_id IS NULL OR _qty IS NULL OR _qty <= 0 THEN
      RAISE EXCEPTION 'Invalid item payload';
    END IF;

    -- Lock/validate via conditional update (atomic)
    UPDATE inventory
    SET available = available - _qty,
        updated_at = now()
    WHERE product_id = _product_id
      AND available >= _qty;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for product %', _product_id;
    END IF;

    -- Snapshot unit price at time of purchase
    SELECT price_ugx INTO _unit_price
    FROM products
    WHERE id = _product_id AND is_active = true;

    IF _unit_price IS NULL THEN
      RAISE EXCEPTION 'Product unavailable %', _product_id;
    END IF;

    _line_total := _unit_price * _qty;
    _items_count := _items_count + _qty;
    _total := _total + _line_total;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price_ugx, line_total_ugx)
    VALUES (_order_id, _product_id, _qty, _unit_price, _line_total);
  END LOOP;

  UPDATE orders
  SET items_count = _items_count,
      total_amount = _total,
      updated_at = now()
  WHERE id = _order_id;

  RETURN _order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS — Auto-update updated_at timestamps
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER distributors_updated_at BEFORE UPDATE ON distributors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
   CREATE TRIGGER client_invites_updated_at BEFORE UPDATE ON client_invites
     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION — Handle client invite acceptance
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION accept_client_invite(_invite_token TEXT, _client_id UUID)
RETURNS VOID AS $$
DECLARE
  _invite_record RECORD;
BEGIN
  -- Find the invite
  SELECT * INTO _invite_record
  FROM client_invites
  WHERE token = _invite_token AND status = 'pending' AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  -- Update invite status
  UPDATE client_invites
  SET status = 'accepted', accepted_at = now(), client_id = _client_id
  WHERE id = _invite_record.id;

  -- Link client to distributor
  UPDATE clients
  SET distributor_id = _invite_record.distributor_id
  WHERE id = _client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION — Auto-create profile on user signup
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
   _role app_role;
   _profile_id UUID;
   _client_id UUID;
BEGIN
   -- Get role from user metadata, default to 'client'
   _role := COALESCE(
     (NEW.raw_user_meta_data->>'role')::app_role,
     'client'
   );

   -- Create profile
   INSERT INTO profiles (auth_user_id, role, full_name, email)
   VALUES (
     NEW.id,
     _role,
     COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
     NEW.email
   )
   RETURNING id INTO _profile_id;

   -- Create role-specific record
   IF _role = 'distributor' THEN
     INSERT INTO distributors (profile_id, distributor_code)
     VALUES (_profile_id, 'DST-' || substr(md5(random()::text), 1, 8));
   ELSIF _role = 'client' THEN
     INSERT INTO clients (profile_id)
     VALUES (_profile_id)
     RETURNING id INTO _client_id;

     -- Handle client invite if token provided
     IF NEW.raw_user_meta_data->>'invite_token' IS NOT NULL THEN
       PERFORM accept_client_invite(NEW.raw_user_meta_data->>'invite_token', _client_id);
     END IF;
   END IF;

   RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributor_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ── Profiles ──────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Managers can view all profiles"
   ON profiles FOR SELECT
   USING (
     EXISTS (
       SELECT 1 FROM profiles p
       WHERE p.auth_user_id = auth.uid() AND p.role = 'manager'
     )
   );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- ── Distributors ──────────────────────────────────────────────────────────────
CREATE POLICY "Distributors can view own record"
  ON distributors FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view all distributors"
   ON distributors FOR SELECT
   USING (
     EXISTS (
       SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role = 'manager'
     )
   );

CREATE POLICY "Managers can update distributors"
   ON distributors FOR UPDATE
   USING (
     EXISTS (
       SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role = 'manager'
     )
   );

-- ── Clients ───────────────────────────────────────────────────────────────────
CREATE POLICY "Clients can view own record"
  ON clients FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Distributors can view assigned clients"
  ON clients FOR SELECT
  USING (
    distributor_id IN (
      SELECT d.id FROM distributors d
      JOIN profiles p ON p.id = d.profile_id
      WHERE p.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view all clients"
   ON clients FOR SELECT
   USING (
     EXISTS (
       SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role = 'manager'
     )
   );

-- ── Messages ──────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    sender_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    OR receiver_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can mark own messages as read"
  ON messages FOR UPDATE
  USING (
    receiver_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

-- ── Activity Logs ─────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own activity"
  ON activity_logs FOR SELECT
  USING (
    user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Managers can view all activity"
   ON activity_logs FOR SELECT
   USING (
     EXISTS (
       SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role = 'manager'
     )
   );

CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true);

-- ── Distributor Locations ─────────────────────────────────────────────────────
CREATE POLICY "Distributors can update own location"
  ON distributor_locations FOR ALL
  USING (
    distributor_id IN (
      SELECT d.id FROM distributors d
      JOIN profiles p ON p.id = d.profile_id
      WHERE p.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view all locations"
   ON distributor_locations FOR SELECT
   USING (
     EXISTS (
       SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role = 'manager'
     )
   );

-- ── Client Invites ────────────────────────────────────────────────────────────
CREATE POLICY "Distributors can view own invites"
   ON client_invites FOR SELECT
   USING (
     distributor_id IN (
       SELECT d.id FROM distributors d
       JOIN profiles p ON p.id = d.profile_id
       WHERE p.auth_user_id = auth.uid()
     )
   );

CREATE POLICY "Distributors can create invites"
   ON client_invites FOR INSERT
   WITH CHECK (
     distributor_id IN (
       SELECT d.id FROM distributors d
       JOIN profiles p ON p.id = d.profile_id
       WHERE p.auth_user_id = auth.uid()
     )
   );

CREATE POLICY "Managers can view all invites"
   ON client_invites FOR SELECT
   USING (
     EXISTS (
       SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role = 'manager'
     )
   );

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (
    user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (
    user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ── Orders ────────────────────────────────────────────────────────────────────
CREATE POLICY "Clients can view own orders"
  ON orders FOR SELECT
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN profiles p ON p.id = c.profile_id
      WHERE p.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Distributors can view assigned orders"
  ON orders FOR SELECT
  USING (
    distributor_id IN (
      SELECT d.id FROM distributors d
      JOIN profiles p ON p.id = d.profile_id
      WHERE p.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── Products & Inventory ──────────────────────────────────────────────────────
-- Public can read active products (catalog).
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Managers can manage products/inventory.
CREATE POLICY "Managers can manage products"
  ON products FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.auth_user_id = auth.uid() AND p.role = 'manager'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.auth_user_id = auth.uid() AND p.role = 'manager'));

CREATE POLICY "Managers can manage inventory"
  ON inventory FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.auth_user_id = auth.uid() AND p.role = 'manager'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.auth_user_id = auth.uid() AND p.role = 'manager'));

-- ── Order items ───────────────────────────────────────────────────────────────
-- Clients/distributors/managers can read order items for orders they can already read.
CREATE POLICY "Order readers can view order items"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      WHERE
        -- client who owns the order
        o.client_id IN (
          SELECT c.id FROM clients c
          JOIN profiles p ON p.id = c.profile_id
          WHERE p.auth_user_id = auth.uid()
        )
        OR
        -- distributor assigned to the order
        o.distributor_id IN (
          SELECT d.id FROM distributors d
          JOIN profiles p ON p.id = d.profile_id
          WHERE p.auth_user_id = auth.uid()
        )
        OR
        -- managers
        EXISTS (SELECT 1 FROM profiles p WHERE p.auth_user_id = auth.uid() AND p.role = 'manager')
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- REALTIME — Enable realtime for key tables
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE client_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE distributor_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
