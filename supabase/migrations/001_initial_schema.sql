-- HatodJasaan Database Schema
-- Supabase PostgreSQL Migration

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Enum types
CREATE TYPE user_role AS ENUM ('customer', 'business', 'rider', 'admin');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'preparing', 'ready_for_pickup',
  'rider_assigned', 'picked_up', 'on_the_way', 'delivered', 'cancelled'
);
CREATE TYPE payment_mode AS ENUM ('cash', 'gcash', 'maya');
CREATE TYPE document_type AS ENUM (
  'government_id', 'barangay_clearance', 'business_permit',
  'drivers_license', 'motorcycle_photo', 'selfie',
  'store_photo', 'residency_proof', 'other'
);
CREATE TYPE business_type AS ENUM (
  'carinderia', 'restaurant', 'lechon_manok', 'bakery',
  'grocery', 'water_station', 'pharmacy', 'other'
);
CREATE TYPE notification_type AS ENUM (
  'order_update', 'approval_update', 'new_order',
  'delivery_request', 'system', 'promotion', 'review'
);

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  status approval_status NOT NULL DEFAULT 'pending',
  address TEXT,
  barangay TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User documents for verification
CREATE TABLE user_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  verified BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Businesses / Eateries
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  business_type business_type NOT NULL DEFAULT 'carinderia',
  phone TEXT,
  email TEXT,
  address TEXT NOT NULL,
  barangay TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  logo_url TEXT,
  cover_url TEXT,
  status approval_status NOT NULL DEFAULT 'pending',
  is_open BOOLEAN DEFAULT FALSE,
  opening_time TIME DEFAULT '06:00',
  closing_time TIME DEFAULT '21:00',
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  avg_prep_time_mins INTEGER DEFAULT 30,
  payment_modes payment_mode[] DEFAULT '{cash}',
  rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Business documents
CREATE TABLE business_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  verified BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rider profiles
CREATE TABLE rider_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  license_number TEXT,
  motorcycle_model TEXT,
  motorcycle_plate TEXT,
  is_available BOOLEAN DEFAULT FALSE,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  total_deliveries INTEGER DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Menu categories
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Menu items
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  business_id UUID NOT NULL REFERENCES businesses(id),
  rider_id UUID REFERENCES profiles(id),
  status order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_mode payment_mode NOT NULL DEFAULT 'cash',
  delivery_address TEXT NOT NULL,
  delivery_lat DOUBLE PRECISION,
  delivery_lng DOUBLE PRECISION,
  customer_notes TEXT,
  business_notes TEXT,
  rider_notes TEXT,
  estimated_delivery_mins INTEGER,
  confirmed_at TIMESTAMPTZ,
  preparing_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  business_id UUID NOT NULL REFERENCES businesses(id),
  rider_id UUID REFERENCES profiles(id),
  business_rating INTEGER NOT NULL CHECK (business_rating >= 1 AND business_rating <= 5),
  rider_rating INTEGER CHECK (rider_rating >= 1 AND rider_rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'system',
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin settings
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO app_settings (key, value) VALUES
  ('base_delivery_fee', '"25"'),
  ('per_km_fee', '"5"'),
  ('max_delivery_radius_km', '"10"'),
  ('platform_fee_percent', '"5"'),
  ('maintenance_mode', 'false');

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_type ON businesses(business_type);
CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_menu_items_business ON menu_items(business_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_business ON orders(business_id);
CREATE INDEX idx_orders_rider ON orders(rider_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_reviews_business ON reviews(business_id);
CREATE INDEX idx_reviews_rider ON reviews(rider_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_user_documents_user ON user_documents(user_id);
CREATE INDEX idx_rider_profiles_user ON rider_profiles(user_id);

-- Row Level Security Policies

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User documents policies
CREATE POLICY "Users can view own documents" ON user_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON user_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents" ON user_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Businesses policies
CREATE POLICY "Approved businesses are viewable by everyone" ON businesses
  FOR SELECT USING (status = 'approved' OR owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Business owners can update own business" ON businesses
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create businesses" ON businesses
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Business documents policies
CREATE POLICY "Business owners can manage own documents" ON business_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Admins can view all business documents" ON business_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Rider profiles policies
CREATE POLICY "Rider profiles viewable by relevant users" ON rider_profiles
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Riders can update own profile" ON rider_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Riders can insert own profile" ON rider_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Menu policies
CREATE POLICY "Menu categories viewable by everyone" ON menu_categories
  FOR SELECT USING (true);

CREATE POLICY "Business owners can manage categories" ON menu_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Menu items viewable by everyone" ON menu_items
  FOR SELECT USING (true);

CREATE POLICY "Business owners can manage menu items" ON menu_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
  );

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (
    customer_id = auth.uid() OR rider_id = auth.uid() OR
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Customers can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Relevant users can update orders" ON orders
  FOR UPDATE USING (
    customer_id = auth.uid() OR rider_id = auth.uid() OR
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Order items policies
CREATE POLICY "Order items viewable by order participants" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE id = order_id AND (
        customer_id = auth.uid() OR rider_id = auth.uid() OR
        EXISTS (SELECT 1 FROM businesses WHERE id = orders.business_id AND owner_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY "Customers can insert order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND customer_id = auth.uid())
  );

-- Reviews policies
CREATE POLICY "Reviews viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Customers can create reviews for their orders" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- App settings policies
CREATE POLICY "App settings viewable by admins" ON app_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update settings" ON app_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Functions

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'HJ-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
    LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rider_profiles_updated_at
  BEFORE UPDATE ON rider_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update business rating
CREATE OR REPLACE FUNCTION update_business_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE businesses SET
    rating = (SELECT AVG(business_rating) FROM reviews WHERE business_id = NEW.business_id),
    total_ratings = (SELECT COUNT(*) FROM reviews WHERE business_id = NEW.business_id)
  WHERE id = NEW.business_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_rating_on_review
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_business_rating();

-- Function to update rider rating
CREATE OR REPLACE FUNCTION update_rider_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rider_id IS NOT NULL AND NEW.rider_rating IS NOT NULL THEN
    UPDATE rider_profiles SET
      rating = (SELECT AVG(rider_rating) FROM reviews WHERE rider_id = NEW.rider_id AND rider_rating IS NOT NULL),
      total_ratings = (SELECT COUNT(*) FROM reviews WHERE rider_id = NEW.rider_id AND rider_rating IS NOT NULL)
    WHERE user_id = NEW.rider_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rider_rating_on_review
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_rider_rating();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create storage buckets (run in Supabase dashboard or via API)
-- avatars: for user profile pictures
-- documents: for verification documents (private)
-- businesses: for business logos and covers
-- menu: for menu item images
