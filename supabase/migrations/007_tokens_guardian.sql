-- Tabla para tokens de acceso de guardianes/padrinos
CREATE TABLE IF NOT EXISTS tokens_guardian (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  nombre TEXT,
  tarjeta_id UUID REFERENCES tarjetas_donacion(id),
  expira_en TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 year'),
  creado_en TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tokens_guardian_token ON tokens_guardian(token);

-- Columna de token de acceso en donaciones
ALTER TABLE donaciones ADD COLUMN IF NOT EXISTS token_acceso TEXT;
ALTER TABLE donaciones ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
