-- =====================================================================
-- Boletera + Membresías "El Nido"
-- Ejecutar en Supabase SQL Editor.
-- =====================================================================

-- Tabla: clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  acepta_whatsapp BOOLEAN DEFAULT false,
  acepta_newsletter BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: tipos_producto
CREATE TABLE IF NOT EXISTS tipos_producto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2),
  categoria TEXT CHECK (categoria IN ('entrada', 'evento', 'membresia', 'paquete_familiar')) NOT NULL,
  activo BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO tipos_producto (nombre, descripcion, precio, categoria, metadata) VALUES
  ('Entrada General', 'Acceso al santuario por 1 día', 150.00, 'entrada', '{"validez_dias": 1}'),
  ('Entrada Niño', 'Niños de 3 a 12 años', 80.00, 'entrada', '{"edad_min": 3, "edad_max": 12}'),
  ('Entrada Adulto Mayor', 'Con credencial INAPAM', 80.00, 'entrada', '{"requiere_identificacion": true}'),
  ('Paquete Familiar', '2 adultos + 2 niños', 380.00, 'paquete_familiar', '{"adultos": 2, "ninos": 2}'),
  ('Guardián Básico', '1 acceso al año + 15% desc eventos + $200 saldo', 500.00, 'membresia', '{"accesos": 1, "validez_dias": 365, "descuento_eventos": 15, "saldo": 200}'),
  ('Guardián Plus', '3 accesos al año + 15% desc eventos + $500 saldo', 800.00, 'membresia', '{"accesos": 3, "validez_dias": 365, "descuento_eventos": 15, "saldo": 500}'),
  ('Guardián Premium', '1 acceso al mes (12 al año) + 15% desc eventos + $1000 saldo', 2000.00, 'membresia', '{"accesos": 12, "validez_dias": 365, "descuento_eventos": 15, "saldo": 1000}'),
  ('Recorrido Nocturno', 'Explora el santuario bajo la luna', 300.00, 'evento', '{"fecha": "2026-08-15", "hora": "20:00", "cupo": 30}'),
  ('Taller de Conservación', 'Aprende sobre aves mexicanas', 200.00, 'evento', '{"fecha": "2026-09-01", "hora": "10:00", "cupo": 20}')
ON CONFLICT DO NOTHING;

-- Tabla: compras
CREATE TABLE IF NOT EXISTS compras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id),
  tipo_producto_id UUID REFERENCES tipos_producto(id),
  stripe_session_id TEXT UNIQUE,
  total DECIMAL(10,2) NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado', 'activado', 'expirado', 'cancelado')),
  membresia_inicio DATE,
  membresia_fin DATE,
  saldo_actual DECIMAL(10,2) DEFAULT 0,
  rfid_uid TEXT UNIQUE,
  descuento_eventos DECIMAL(5,2),
  qr_code TEXT UNIQUE,
  fecha_visita DATE,
  cantidad_personas INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: compra_items (una fila por producto vendido dentro de una compra)
CREATE TABLE IF NOT EXISTS compra_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compra_id UUID REFERENCES compras(id) ON DELETE CASCADE,
  tipo_producto_id UUID REFERENCES tipos_producto(id),
  nombre TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  categoria TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compra_items_compra_id ON compra_items(compra_id);

-- Tabla: campanas
CREATE TABLE IF NOT EXISTS campanas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo_descuento TEXT UNIQUE,
  porcentaje_descuento DECIMAL(5,2),
  regalo TEXT,
  limite_regalos INTEGER,
  regalos_entregados INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ
);

INSERT INTO campanas (nombre, codigo_descuento, porcentaje_descuento, regalo, limite_regalos) VALUES
  ('Lanzamiento 2026', 'ELNIDO2026', 10.00, 'Camiseta Edición Especial', 100)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- RPC: incrementar_regalo
-- Incrementa regalos_entregados de forma atómica si aún queda cupo.
-- Devuelve TRUE si se pudo reservar un regalo, FALSE si se agotó/expiró.
-- =====================================================================
CREATE OR REPLACE FUNCTION incrementar_regalo(p_codigo TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_actualizado INTEGER;
BEGIN
  UPDATE campanas
  SET regalos_entregados = regalos_entregados + 1
  WHERE codigo_descuento = p_codigo
    AND activa = true
    AND (limite_regalos IS NULL OR regalos_entregados < limite_regalos)
    AND (fecha_inicio IS NULL OR now() >= fecha_inicio)
    AND (fecha_fin IS NULL OR now() <= fecha_fin);

  GET DIAGNOSTICS v_actualizado = ROW_COUNT;
  RETURN v_actualizado > 0;
END;
$$;

-- =====================================================================
-- RLS: las tablas se acceden desde el servidor con la service-role key
-- (createAdminSupabaseClient), que ignora RLS. Si habilitas RLS, añade
-- políticas de lectura pública para tipos_producto y campanas.
-- =====================================================================
