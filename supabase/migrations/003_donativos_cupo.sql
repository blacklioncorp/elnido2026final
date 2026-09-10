-- =============================================================
-- MIGRACIÓN 003: Sistema de Donativos + Control de Cupo
-- El Nido — Santuario de Fauna Mexicana
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================================

-- ---------------------------------------------------------------
-- 1. TARJETAS DE DONACIÓN (especies a apadrinar)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tarjetas_donacion (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_especie  TEXT NOT NULL,
  nombre_animal   TEXT,
  tipo            TEXT CHECK (tipo IN ('especie', 'animal_individual', 'familia')) NOT NULL,
  descripcion     TEXT NOT NULL,
  historia        TEXT,
  imagen_url      TEXT,
  meta_tipo       TEXT CHECK (meta_tipo IN ('unica', 'mensual')) NOT NULL,
  meta_monto      DECIMAL(10,2) NOT NULL,
  monto_recaudado DECIMAL(10,2) DEFAULT 0,
  activa          BOOLEAN DEFAULT false,
  meta_cumplida   BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------
-- 2. TABLA DONACIONES (unificada: /donar + /donativos)
--    OPCIÓN B: La tabla donaciones se crea nueva aquí.
--    Si ya existiera de una migración anterior, ejecuta las
--    líneas ALTER TABLE comentadas al final en su lugar.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donaciones (
  id                UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  tarjeta_id        UUID    REFERENCES tarjetas_donacion(id) ON DELETE SET NULL NULL,
  donante_nombre    TEXT    NOT NULL,
  donante_email     TEXT    NOT NULL,
  donante_username  TEXT,
  monto             DECIMAL(10,2) NOT NULL,
  stripe_session_id TEXT    UNIQUE,
  mensaje           TEXT,
  origen            TEXT    DEFAULT 'donar' CHECK (origen IN ('donar', 'donativos')),
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Índices útiles para reportes y consultas de donantes por tarjeta
CREATE INDEX IF NOT EXISTS idx_donaciones_tarjeta_id ON donaciones(tarjeta_id);
CREATE INDEX IF NOT EXISTS idx_donaciones_email ON donaciones(donante_email);
CREATE INDEX IF NOT EXISTS idx_donaciones_created_at ON donaciones(created_at DESC);

-- ---------------------------------------------------------------
-- 3. CUPO DIARIO
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cupo_diario (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha           DATE    UNIQUE NOT NULL,
  cupo_maximo     INTEGER NOT NULL DEFAULT 50,
  lugares_ocupados INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cupo_diario_fecha ON cupo_diario(fecha);

-- ---------------------------------------------------------------
-- 4. TABLA CONFIGURACIÓN (clave-valor general del santuario)
--    Si ya existe de una migración anterior, omite este bloque.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracion (
  clave     TEXT PRIMARY KEY,
  valor     TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Valores por defecto para WhatsApp
INSERT INTO configuracion (clave, valor) VALUES
  ('whatsapp_numero',    '521XXXXXXXXXX'),
  ('whatsapp_mensaje',   'Hola, quiero información sobre El Nido 🦜'),
  ('n8n_webhook_url',    '')
ON CONFLICT (clave) DO NOTHING;

-- ---------------------------------------------------------------
-- 5. FUNCIÓN RPC: consultar_disponibilidad
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION consultar_disponibilidad(fecha_consulta DATE)
RETURNS TABLE (
  fecha             DATE,
  cupo_maximo       INTEGER,
  lugares_ocupados  INTEGER,
  disponibles       INTEGER
) AS $$
BEGIN
  -- Crea el registro del día si no existe aún
  INSERT INTO cupo_diario (fecha, cupo_maximo, lugares_ocupados)
  VALUES (fecha_consulta, 50, 0)
  ON CONFLICT (fecha) DO NOTHING;

  RETURN QUERY
  SELECT
    cd.fecha,
    cd.cupo_maximo,
    cd.lugares_ocupados,
    cd.cupo_maximo - cd.lugares_ocupados AS disponibles
  FROM cupo_diario cd
  WHERE cd.fecha = fecha_consulta;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------
-- 6. FUNCIÓN + TRIGGER: verificar meta cumplida
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION verificar_meta_cumplida()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.monto_recaudado >= NEW.meta_monto AND NEW.meta_cumplida = false THEN
    NEW.meta_cumplida := true;
    NEW.activa        := false;
    NEW.updated_at    := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_verificar_meta ON tarjetas_donacion;

CREATE TRIGGER trigger_verificar_meta
  BEFORE UPDATE ON tarjetas_donacion
  FOR EACH ROW EXECUTE FUNCTION verificar_meta_cumplida();

-- Trigger para updated_at en tarjetas_donacion
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_updated_at_tarjetas ON tarjetas_donacion;

CREATE TRIGGER trigger_updated_at_tarjetas
  BEFORE UPDATE ON tarjetas_donacion
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- ---------------------------------------------------------------
-- 7. SUPABASE STORAGE: bucket 'especies'
--    Ejecutar manualmente en Supabase Dashboard > Storage:
--    Crear bucket público llamado 'especies'
--    O ejecutar con la API REST de Supabase Storage.
-- ---------------------------------------------------------------
-- (Manual: Dashboard > Storage > New bucket > Name: especies, Public: true)

-- ---------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------
-- tarjetas_donacion: lectura pública, escritura solo service_role
ALTER TABLE tarjetas_donacion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tarjetas_lectura_publica" ON tarjetas_donacion;
CREATE POLICY "tarjetas_lectura_publica"
  ON tarjetas_donacion FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "tarjetas_escritura_service" ON tarjetas_donacion;
CREATE POLICY "tarjetas_escritura_service"
  ON tarjetas_donacion FOR ALL
  USING (auth.role() = 'service_role');

-- donaciones: lectura solo service_role, inserción pública (vía webhook)
ALTER TABLE donaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "donaciones_service_role" ON donaciones;
CREATE POLICY "donaciones_service_role"
  ON donaciones FOR ALL
  USING (auth.role() = 'service_role');

-- cupo_diario: lectura pública (para mostrar disponibilidad), escritura service_role
ALTER TABLE cupo_diario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cupo_lectura_publica" ON cupo_diario;
CREATE POLICY "cupo_lectura_publica"
  ON cupo_diario FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "cupo_escritura_service" ON cupo_diario;
CREATE POLICY "cupo_escritura_service"
  ON cupo_diario FOR ALL
  USING (auth.role() = 'service_role');

-- configuracion: lectura pública (para widget), escritura service_role
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "config_lectura_publica" ON configuracion;
CREATE POLICY "config_lectura_publica"
  ON configuracion FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "config_escritura_service" ON configuracion;
CREATE POLICY "config_escritura_service"
  ON configuracion FOR ALL
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------
-- 9. FUNCIÓN RPC: incrementar_cupo (atómica)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION incrementar_cupo(p_fecha DATE, p_cantidad INTEGER)
RETURNS void AS $$
BEGIN
  -- Ensure row exists first
  INSERT INTO cupo_diario (fecha, cupo_maximo, lugares_ocupados)
  VALUES (p_fecha, 50, 0)
  ON CONFLICT (fecha) DO NOTHING;

  -- Atomic increment
  UPDATE cupo_diario
  SET lugares_ocupados = LEAST(lugares_ocupados + p_cantidad, cupo_maximo)
  WHERE fecha = p_fecha;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to service_role
GRANT EXECUTE ON FUNCTION incrementar_cupo(DATE, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION consultar_disponibilidad(DATE) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------
-- FIN DE LA MIGRACIÓN 003
-- ---------------------------------------------------------------
