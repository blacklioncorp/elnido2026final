-- Tabla de feriados y días especiales
CREATE TABLE IF NOT EXISTS dias_especiales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE UNIQUE NOT NULL,
  tipo TEXT CHECK (tipo IN ('feriado', 'evento', 'vacaciones', 'cerrado')) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar feriados oficiales 2026
INSERT INTO dias_especiales (fecha, tipo, descripcion) VALUES
('2026-01-01', 'feriado', 'Año Nuevo'),
('2026-02-02', 'feriado', 'Día de la Constitución'),
('2026-03-16', 'feriado', 'Natalicio de Benito Juárez'),
('2026-05-01', 'feriado', 'Día del Trabajo'),
('2026-09-16', 'feriado', 'Día de la Independencia'),
('2026-11-02', 'feriado', 'Día de Muertos'),
('2026-11-16', 'feriado', 'Revolución Mexicana'),
('2026-12-25', 'feriado', 'Navidad')
ON CONFLICT (fecha) DO NOTHING;
