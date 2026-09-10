-- ============================================================
-- MIGRACIÓN 004: Fauna, Bitácora, Blog, Roles Admin
-- El Nido 2026 — ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. TABLA DE ROLES ADMIN
CREATE TABLE IF NOT EXISTS admin_roles (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  permisos TEXT[] NOT NULL DEFAULT '{}'
);

INSERT INTO admin_roles (id, label, permisos) VALUES
  ('superadmin', 'Super Administrador', ARRAY['fauna','blog','bitacora','donativos','boletos','pos','reportes','cajas','configuracion','grupos','usuarios']),
  ('editor',     'Editor',             ARRAY['fauna','blog','bitacora','donativos','grupos']),
  ('cuidador',   'Cuidador',           ARRAY['bitacora']),
  ('cajero',     'Cajero',             ARRAY['pos'])
ON CONFLICT (id) DO NOTHING;

-- 2. EXTENDER PROFILES
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_role TEXT REFERENCES admin_roles(id),
  ADD COLUMN IF NOT EXISTS email      TEXT,
  ADD COLUMN IF NOT EXISTS activo     BOOLEAN DEFAULT true;

-- 3. TABLA FAUNA
CREATE TABLE IF NOT EXISTS fauna (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre            TEXT        NOT NULL,
  nombre_cientifico TEXT,
  slug              TEXT        UNIQUE NOT NULL,
  tipo              TEXT        NOT NULL DEFAULT 'otro'
                    CHECK (tipo IN ('ave','mamifero','reptil','felino','primate','otro')),
  descripcion       TEXT,
  historia          TEXT,
  imagen_url        TEXT,
  galeria           JSONB       NOT NULL DEFAULT '[]',
  activo            BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER fauna_updated_at BEFORE UPDATE ON fauna FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. TABLA BITÁCORA
CREATE TABLE IF NOT EXISTS bitacora (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  fauna_id            UUID        REFERENCES fauna(id) ON DELETE SET NULL,
  autor_id            UUID        NOT NULL REFERENCES auth.users(id),
  titulo              TEXT        NOT NULL,
  contenido           TEXT        NOT NULL,
  imagen_url          TEXT,
  video_url           TEXT,
  visibilidad         TEXT        NOT NULL DEFAULT 'publico'
                      CHECK (visibilidad IN ('publico','padrinos','mixto')),
  estado              TEXT        NOT NULL DEFAULT 'borrador'
                      CHECK (estado IN ('borrador','revision','publicado','rechazado')),
  revisor_id          UUID        REFERENCES auth.users(id),
  comentario_revision TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER bitacora_updated_at BEFORE UPDATE ON bitacora FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_bitacora_estado      ON bitacora(estado);
CREATE INDEX IF NOT EXISTS idx_bitacora_visibilidad ON bitacora(visibilidad);
CREATE INDEX IF NOT EXISTS idx_bitacora_autor       ON bitacora(autor_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_fauna       ON bitacora(fauna_id);

-- 5. TABLA BLOG
CREATE TABLE IF NOT EXISTS blog (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo     TEXT        NOT NULL,
  slug       TEXT        UNIQUE NOT NULL,
  contenido  TEXT        NOT NULL DEFAULT '',
  excerpt    TEXT,
  imagen_url TEXT,
  autor_id   UUID        REFERENCES auth.users(id),
  publicado  BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER blog_updated_at BEFORE UPDATE ON blog FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX IF NOT EXISTS idx_blog_publicado ON blog(publicado);
CREATE INDEX IF NOT EXISTS idx_blog_slug      ON blog(slug);

-- 6. RLS
ALTER TABLE fauna ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fauna_public_read" ON fauna;
DROP POLICY IF EXISTS "fauna_admin_all" ON fauna;
CREATE POLICY "fauna_public_read" ON fauna FOR SELECT USING (activo = true);
CREATE POLICY "fauna_admin_all" ON fauna FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE bitacora ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bitacora_public_read" ON bitacora;
DROP POLICY IF EXISTS "bitacora_auth_read" ON bitacora;
DROP POLICY IF EXISTS "bitacora_autor_write" ON bitacora;
DROP POLICY IF EXISTS "bitacora_autor_update" ON bitacora;
CREATE POLICY "bitacora_public_read" ON bitacora FOR SELECT USING (estado = 'publicado' AND visibilidad = 'publico');
CREATE POLICY "bitacora_auth_read"   ON bitacora FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "bitacora_autor_write" ON bitacora FOR INSERT WITH CHECK (auth.uid() = autor_id);
CREATE POLICY "bitacora_autor_update" ON bitacora FOR UPDATE USING (auth.uid() = autor_id OR auth.role() = 'authenticated');

ALTER TABLE blog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blog_public_read" ON blog;
DROP POLICY IF EXISTS "blog_admin_all" ON blog;
CREATE POLICY "blog_public_read" ON blog FOR SELECT USING (publicado = true);
CREATE POLICY "blog_admin_all"   ON blog FOR ALL USING (auth.role() = 'authenticated');
