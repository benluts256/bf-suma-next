CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
CREATE TYPE app_role AS ENUM ('manager','distributor','client');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE TYPE order_status AS ENUM ('pending','processing','shipped','delivered','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE TYPE payment_status AS ENUM ('pending','paid','failed','refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE TYPE message_type AS ENUM ('text','image','system');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE TYPE commission_status AS ENUM ('pending','approved','paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS profiles(

id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

auth_user_id UUID UNIQUE
REFERENCES auth.users(id)
ON DELETE CASCADE,

role app_role DEFAULT 'client',

full_name TEXT,
email TEXT,
phone TEXT,
avatar_url TEXT,

is_active BOOLEAN DEFAULT TRUE,

created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_profiles_auth
ON profiles(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_role
ON profiles(role);

CREATE TABLE IF NOT EXISTS distributors(

id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

profile_id UUID UNIQUE
REFERENCES profiles(id)
ON DELETE CASCADE,

distributor_code TEXT UNIQUE,

rank TEXT DEFAULT 'Bronze',
rank_points INTEGER DEFAULT 0,

total_sales NUMERIC(12,2) DEFAULT 0,

commission_rate NUMERIC(5,4) DEFAULT 0.15,

region TEXT,

created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS clients(

id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

profile_id UUID UNIQUE
REFERENCES profiles(id)
ON DELETE CASCADE,

distributor_id UUID
REFERENCES distributors(id),

shipping_address TEXT,

total_orders INTEGER DEFAULT 0,
total_spent NUMERIC(12,2) DEFAULT 0,

created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS products(

id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

name TEXT NOT NULL,
sku TEXT UNIQUE,

description TEXT,

price_ugx NUMERIC(12,2),

is_active BOOLEAN DEFAULT TRUE,

created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS inventory(

product_id UUID PRIMARY KEY
REFERENCES products(id)
ON DELETE CASCADE,

available INTEGER DEFAULT 0 CHECK(available>=0),

reserved INTEGER DEFAULT 0 CHECK(reserved>=0),

updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS orders(

id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

client_id UUID
REFERENCES clients(id),

distributor_id UUID
REFERENCES distributors(id),

status order_status DEFAULT 'pending',

total_amount NUMERIC(12,2),

shipping_address TEXT,

created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_orders_client
ON orders(client_id);

CREATE INDEX IF NOT EXISTS idx_orders_distributor
ON orders(distributor_id);

CREATE TABLE IF NOT EXISTS order_items(

id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

order_id UUID
REFERENCES orders(id)
ON DELETE CASCADE,

product_id UUID
REFERENCES products(id),

quantity INTEGER,

unit_price NUMERIC(12,2),

line_total NUMERIC(12,2),

created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS payments(

id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

order_id UUID
REFERENCES orders(id),

amount NUMERIC(12,2),

status payment_status DEFAULT 'pending',

payment_method TEXT,

transaction_reference TEXT,

created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS payments(

id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

order_id UUID
REFERENCES orders(id),

amount NUMERIC(12,2),

status payment_status DEFAULT 'pending',

payment_method TEXT,

transaction_reference TEXT,

created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS conversations(

id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

user_a UUID REFERENCES profiles(id),
user_b UUID REFERENCES profiles(id),

created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS messages(

id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

conversation_id UUID
REFERENCES conversations(id)
ON DELETE CASCADE,

sender_id UUID
REFERENCES profiles(id),

content TEXT,

message_type message_type DEFAULT 'text',

is_read BOOLEAN DEFAULT FALSE,

created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS notifications(

id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

user_id UUID
REFERENCES profiles(id),

title TEXT,
body TEXT,

is_read BOOLEAN DEFAULT FALSE,

created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS distributor_locations(

id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

distributor_id UUID
REFERENCES distributors(id),

latitude NUMERIC(10,8),
longitude NUMERIC(11,8),

is_online BOOLEAN DEFAULT TRUE,

created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS activity_logs(

id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

user_id UUID
REFERENCES profiles(id),

activity TEXT,

metadata JSONB,

created_at TIMESTAMPTZ DEFAULT now()

);

CREATE OR REPLACE FUNCTION update_updated_at()

RETURNS TRIGGER

LANGUAGE plpgsql

AS $$

BEGIN

NEW.updated_at = now();

RETURN NEW;

END;

$$;

CREATE OR REPLACE FUNCTION handle_new_user()

RETURNS TRIGGER

LANGUAGE plpgsql
SECURITY DEFINER

AS $$

DECLARE
user_role app_role;

BEGIN

user_role :=
COALESCE(
(NEW.raw_user_meta_data->>'role')::app_role,
'client'
);

INSERT INTO profiles(auth_user_id,role,email)
VALUES (NEW.id,user_role,NEW.email);

RETURN NEW;

END;

$$;

DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

CREATE TRIGGER create_profile_on_signup

AFTER INSERT ON auth.users

FOR EACH ROW

EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_client_order_stats()

RETURNS TRIGGER

LANGUAGE plpgsql

AS $$

BEGIN

UPDATE clients

SET
total_orders = total_orders + 1,
total_spent = total_spent + NEW.total_amount

WHERE id = NEW.client_id;

RETURN NEW;

END;

$$;

CREATE TRIGGER update_client_stats

AFTER INSERT ON orders

FOR EACH ROW

EXECUTE FUNCTION update_client_order_stats();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile"

ON profiles FOR SELECT

USING(auth.uid() = auth_user_id);

CREATE POLICY "Clients view orders"

ON orders FOR SELECT

USING(

client_id IN (

SELECT c.id

FROM clients c
JOIN profiles p ON p.id = c.profile_id

WHERE p.auth_user_id = auth.uid()

)

);

CREATE POLICY "Users read own messages"

ON messages FOR SELECT

USING(

sender_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())

);

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE distributor_locations;

