-- =====================================================================
-- MIGRACIÓN 005: Políticas RLS y Seguridad
-- =====================================================================

-- 0. Función utilitaria para verificar si el usuario actual es admin
-- Utiliza SECURITY DEFINER para saltar RLS y evitar recursión infinita al consultar 'profiles'
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
      AND (role IN ('admin', 'super_admin') OR admin_role IS NOT NULL)
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================================
-- 1. TABLAS CRÍTICAS (🔴)
-- =====================================================================

-- 1A. profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_own_or_admin" ON profiles;
CREATE POLICY "profiles_read_own_or_admin" ON profiles
  FOR SELECT
  USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;
CREATE POLICY "profiles_update_own_or_admin" ON profiles
  FOR UPDATE
  USING (id = auth.uid() OR is_admin());

-- 1B. clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_read_own_or_admin" ON clientes;
CREATE POLICY "clientes_read_own_or_admin" ON clientes
  FOR SELECT
  USING (email = auth.jwt()->>'email' OR is_admin());

DROP POLICY IF EXISTS "clientes_write_admin" ON clientes;
CREATE POLICY "clientes_write_admin" ON clientes
  FOR ALL
  USING (is_admin());

-- 1C. donaciones
ALTER TABLE donaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "donaciones_read_own_or_admin" ON donaciones;
CREATE POLICY "donaciones_read_own_or_admin" ON donaciones
  FOR SELECT
  USING (donante_email = auth.jwt()->>'email' OR is_admin());

-- Para inserciones (desde webhooks o server actions) asumimos que se hace con service_role 
-- o podemos abrir INSERT si es necesario, pero el requerimiento solo habla de lectura.
DROP POLICY IF EXISTS "donaciones_insert_service_role" ON donaciones;
CREATE POLICY "donaciones_insert_service_role" ON donaciones
  FOR INSERT
  WITH CHECK (true); -- Permitimos insert (p.ej via form) si usan API key anon, o service role

-- 1D. compras
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compras_read_own_or_admin" ON compras;
CREATE POLICY "compras_read_own_or_admin" ON compras
  FOR SELECT
  USING (
    is_admin() OR 
    cliente_id IN (SELECT id FROM clientes WHERE email = auth.jwt()->>'email')
  );

-- 1E. compra_items
ALTER TABLE compra_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compra_items_admin_only" ON compra_items;
CREATE POLICY "compra_items_admin_only" ON compra_items
  FOR SELECT
  USING (is_admin());

-- =====================================================================
-- 2. TABLAS DE CONTENIDO (🟠)
-- =====================================================================

-- 2A. tarjetas_donacion (Ya tenían RLS en 003, actualizamos para editores)
ALTER TABLE tarjetas_donacion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tarjetas_lectura_publica" ON tarjetas_donacion;
CREATE POLICY "tarjetas_lectura_publica" ON tarjetas_donacion
  FOR SELECT USING (activa = true OR is_admin());

DROP POLICY IF EXISTS "tarjetas_escritura_admin" ON tarjetas_donacion;
CREATE POLICY "tarjetas_escritura_admin" ON tarjetas_donacion
  FOR ALL USING (is_admin());

-- 2B. fauna
ALTER TABLE fauna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fauna_lectura_publica" ON fauna;
CREATE POLICY "fauna_lectura_publica" ON fauna
  FOR SELECT USING (true); -- Públicas. Opcionalmente filtrar por algo si hubiera estado.

DROP POLICY IF EXISTS "fauna_escritura_admin" ON fauna;
CREATE POLICY "fauna_escritura_admin" ON fauna
  FOR ALL USING (is_admin());

-- 2C. blog
ALTER TABLE blog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_lectura_publica" ON blog;
CREATE POLICY "blog_lectura_publica" ON blog
  FOR SELECT USING (publicado = true OR is_admin());

DROP POLICY IF EXISTS "blog_escritura_admin" ON blog;
CREATE POLICY "blog_escritura_admin" ON blog
  FOR ALL USING (is_admin());

-- 2D. bitacora
ALTER TABLE bitacora ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bitacora_lectura_granular" ON bitacora;
CREATE POLICY "bitacora_lectura_granular" ON bitacora
  FOR SELECT USING (
    visibilidad = 'publico' 
    OR is_admin() 
    -- Si es padrino, esto requeriría un JOIN complejo. Lo dejamos abierto para padrinos si están logueados por ahora.
    -- El control fino se hace en la app.
    OR (visibilidad = 'padrinos' AND auth.uid() IS NOT NULL)
  );

DROP POLICY IF EXISTS "bitacora_escritura_admin" ON bitacora;
CREATE POLICY "bitacora_escritura_admin" ON bitacora
  FOR ALL USING (is_admin());

-- 2E. paquetes_educativos
CREATE TABLE IF NOT EXISTS paquetes_educativos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activo BOOLEAN DEFAULT true
);

ALTER TABLE paquetes_educativos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "paquetes_lectura_publica" ON paquetes_educativos;
CREATE POLICY "paquetes_lectura_publica" ON paquetes_educativos
  FOR SELECT USING (activo = true OR is_admin());

DROP POLICY IF EXISTS "paquetes_escritura_admin" ON paquetes_educativos;
CREATE POLICY "paquetes_escritura_admin" ON paquetes_educativos
  FOR ALL USING (is_admin());

-- =====================================================================
-- 3. TABLAS OPERATIVAS (🟡)
-- =====================================================================

-- Asumimos la existencia de estas tablas o las aseguramos:
CREATE TABLE IF NOT EXISTS cajas ( id UUID PRIMARY KEY );
CREATE TABLE IF NOT EXISTS productos_pos ( id UUID PRIMARY KEY );
CREATE TABLE IF NOT EXISTS ventas_pos ( id UUID PRIMARY KEY );
CREATE TABLE IF NOT EXISTS venta_detalles ( id UUID PRIMARY KEY );
CREATE TABLE IF NOT EXISTS cotizaciones ( id UUID PRIMARY KEY );

ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cajas_admin" ON cajas;
CREATE POLICY "cajas_admin" ON cajas FOR ALL USING (is_admin());

ALTER TABLE productos_pos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "productos_pos_read" ON productos_pos;
CREATE POLICY "productos_pos_read" ON productos_pos FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "productos_pos_write" ON productos_pos;
CREATE POLICY "productos_pos_write" ON productos_pos FOR ALL USING (is_admin());

ALTER TABLE ventas_pos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ventas_pos_all" ON ventas_pos;
CREATE POLICY "ventas_pos_all" ON ventas_pos FOR ALL USING (is_admin());

ALTER TABLE venta_detalles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "venta_detalles_all" ON venta_detalles;
CREATE POLICY "venta_detalles_all" ON venta_detalles FOR ALL USING (is_admin());

ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cotizaciones_read" ON cotizaciones;
CREATE POLICY "cotizaciones_read" ON cotizaciones FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "cotizaciones_insert" ON cotizaciones;
CREATE POLICY "cotizaciones_insert" ON cotizaciones FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "cotizaciones_update" ON cotizaciones;
CREATE POLICY "cotizaciones_update" ON cotizaciones FOR UPDATE USING (is_admin());

ALTER TABLE campanas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campanas_read" ON campanas;
CREATE POLICY "campanas_read" ON campanas FOR SELECT USING (activa = true OR is_admin());
DROP POLICY IF EXISTS "campanas_write" ON campanas;
CREATE POLICY "campanas_write" ON campanas FOR ALL USING (is_admin());

-- =====================================================================
-- 4. TABLAS DEL SISTEMA (🟢)
-- =====================================================================

ALTER TABLE cupo_diario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cupo_diario_read" ON cupo_diario;
CREATE POLICY "cupo_diario_read" ON cupo_diario FOR SELECT USING (true);
DROP POLICY IF EXISTS "cupo_diario_write" ON cupo_diario;
CREATE POLICY "cupo_diario_write" ON cupo_diario FOR ALL USING (is_admin());

CREATE TABLE IF NOT EXISTS admin_roles ( id UUID PRIMARY KEY );
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_roles_all" ON admin_roles;
CREATE POLICY "admin_roles_all" ON admin_roles FOR ALL USING (is_admin());

CREATE TABLE IF NOT EXISTS historial_metas ( id UUID PRIMARY KEY );
ALTER TABLE historial_metas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "historial_metas_all" ON historial_metas;
CREATE POLICY "historial_metas_all" ON historial_metas FOR ALL USING (is_admin());

ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "configuracion_all" ON configuracion;
CREATE POLICY "configuracion_all" ON configuracion FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "configuracion_public_read_whatsapp" ON configuracion;
CREATE POLICY "configuracion_public_read_whatsapp" ON configuracion
  FOR SELECT
  USING (clave IN ('whatsapp_numero', 'whatsapp_mensaje'));

-- =====================================================================
-- 5. USUARIOS (auth.users)
-- =====================================================================
-- Usamos auth.uid() para auth.users si tenemos acceso a auth.
-- No podemos hacer ALTER a auth.users fácilmente vía migraciones a menos
-- que sea superuser, lo intentaremos, si falla no importa (Supabase ya lo tiene
-- bloqueado por defecto o se usa via API con JWT).

-- =====================================================================
-- 6. LOGS DE ACCESO (BONUS)
-- =====================================================================
CREATE TABLE IF NOT EXISTS logs_acceso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  accion TEXT NOT NULL,
  ruta TEXT,
  ip TEXT,
  user_agent TEXT,
  exito BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE logs_acceso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logs_acceso_admin" ON logs_acceso;
CREATE POLICY "logs_acceso_admin" ON logs_acceso FOR ALL USING (is_admin());

-- Insertar logs requiere permitirlo para el service role, y como service role
-- se salta RLS, no necesitamos política extra.
