-- ============================================================
-- Araç Kiralama Yönetim Sistemi - Supabase Schema
-- ============================================================

-- Araçlar tablosu
CREATE TABLE vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plate_number TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT,
  fuel_type TEXT DEFAULT 'benzin' CHECK (fuel_type IN ('benzin', 'dizel', 'lpg', 'elektrik', 'hibrit')),
  transmission TEXT DEFAULT 'manuel' CHECK (transmission IN ('manuel', 'otomatik')),
  status TEXT DEFAULT 'musait' CHECK (status IN ('musait', 'kirada', 'bakimda', 'pasif')),
  daily_rate DECIMAL(10, 2) NOT NULL,
  km INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Müşteriler tablosu
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  id_number TEXT UNIQUE, -- TC Kimlik No
  driving_license TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sözleşmeler tablosu
CREATE TABLE contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number TEXT UNIQUE NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_rate DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  deposit_amount DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'aktif' CHECK (status IN ('aktif', 'tamamlandi', 'iptal')),
  km_start INTEGER DEFAULT 0,
  km_end INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ödemeler tablosu
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT DEFAULT 'nakit' CHECK (payment_method IN ('nakit', 'havale', 'kredi_karti', 'diger')),
  payment_type TEXT DEFAULT 'kira' CHECK (payment_type IN ('kira', 'depozito', 'iade', 'diger')),
  status TEXT DEFAULT 'odendi' CHECK (status IN ('odendi', 'bekliyor', 'gecikti')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- İndeksler
-- ============================================================
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_plate ON vehicles(plate_number);
CREATE INDEX idx_contracts_vehicle ON contracts(vehicle_id);
CREATE INDEX idx_contracts_customer ON contracts(customer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_dates ON contracts(start_date, end_date);
CREATE INDEX idx_payments_contract ON payments(contract_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Sözleşme numarası otomatik oluşturma
-- ============================================================
CREATE SEQUENCE contract_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contract_number IS NULL OR NEW.contract_number = '' THEN
    NEW.contract_number = 'SZ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('contract_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_contract_number BEFORE INSERT ON contracts
  FOR EACH ROW EXECUTE FUNCTION generate_contract_number();

-- ============================================================
-- Row Level Security (RLS) - Supabase Auth ile kullanım için
-- ============================================================
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Authenticated kullanıcılar tüm işlemleri yapabilir
CREATE POLICY "authenticated_all" ON vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
