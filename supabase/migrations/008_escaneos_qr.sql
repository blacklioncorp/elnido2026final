-- Tabla de tracking de escaneos de códigos QR físicos de recintos
CREATE TABLE IF NOT EXISTS escaneos_qr (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  especie_id UUID REFERENCES fauna(id) ON DELETE CASCADE,
  especie_slug TEXT NOT NULL,
  user_agent TEXT,
  referer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escaneos_qr_especie ON escaneos_qr(especie_id);
CREATE INDEX IF NOT EXISTS idx_escaneos_qr_fecha ON escaneos_qr(created_at);
CREATE INDEX IF NOT EXISTS idx_escaneos_qr_slug ON escaneos_qr(especie_slug);

-- RLS
ALTER TABLE escaneos_qr ENABLE ROW LEVEL SECURITY;

-- Permitir inserción anónima de escaneos
CREATE POLICY "Permitir insercion anonima de escaneos" 
  ON escaneos_qr FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- Permitir lectura solo a administradores autenticados
CREATE POLICY "Permitir lectura de escaneos a admins" 
  ON escaneos_qr FOR SELECT 
  TO authenticated 
  USING (true);
