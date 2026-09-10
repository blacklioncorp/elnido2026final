-- Tabla de Cajas
CREATE TABLE public.cajas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('taquilla', 'cafeteria', 'tienda', 'general')),
    nip TEXT NOT NULL,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Productos POS
CREATE TABLE public.productos_pos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    precio NUMERIC(10,2) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Ventas POS (Cabecera del Ticket)
CREATE TABLE public.ventas_pos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caja_id UUID REFERENCES public.cajas(id),
    cliente_id UUID NULL,
    total NUMERIC(10,2) NOT NULL,
    metodo_pago TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Detalles de Venta POS (Productos del Ticket)
CREATE TABLE public.venta_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES public.ventas_pos(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES public.productos_pos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL
);

-- Habilitar RLS temporalmente o dejar que la Service Role Key se salte esto
ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venta_detalles ENABLE ROW LEVEL SECURITY;

-- Crear un Trigger de Función para Restar el saldo si el pago es RFID (Opcional por ahora)

-- Políticas RLS básicas para permitir todas las operaciones (desarrollo/pruebas)
CREATE POLICY "Allow all operations for cajas" ON public.cajas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for productos_pos" ON public.productos_pos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for ventas_pos" ON public.ventas_pos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for venta_detalles" ON public.venta_detalles FOR ALL USING (true) WITH CHECK (true);
