/**
 * Motor inteligente para el cálculo de feriados y días festivos en México.
 *
 * Incluye:
 * 1. Días de descanso obligatorio según el Artículo 74 de la Ley Federal del Trabajo (LFT):
 *    - Días fijos (1 ene, 1 may, 16 sep, 25 dic, 1 oct en año electoral federal).
 *    - Días móviles ("puentes" que se trasladan al lunes: 1er lunes de feb, 3er lunes de mar, 3er lunes de nov).
 * 2. Fechas históricas y cívicas oficiales exactas (5 feb, 21 mar, 20 nov).
 * 3. Festividades tradicionales relevantes en México (2 nov Día de Muertos, Semana Santa, 12 dic).
 */

export interface FeriadoCalculado {
  fecha: string; // YYYY-MM-DD
  tipo: 'feriado' | 'evento' | 'vacaciones';
  descripcion: string;
  categoria: 'oficial_lft' | 'civica_historica' | 'tradicional';
  esDescansoObligatorio: boolean;
}

/**
 * Calcula el n-ésimo día de la semana de un mes (ej: 1er lunes de febrero, 3er lunes de marzo).
 * @param year Año
 * @param month Mes (1 a 12)
 * @param dayOfWeek Día de la semana deseado (0=Domingo, 1=Lunes, ..., 6=Sábado)
 * @param nth Ocurrencia (1 para primer, 2 para segundo, 3 para tercer, etc.)
 */
function getNthDayOfMonth(year: number, month: number, dayOfWeek: number, nth: number): number {
  let count = 0;
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    if (d.getDay() === dayOfWeek) {
      count++;
      if (count === nth) {
        return day;
      }
    }
  }
  return 1;
}

/**
 * Algoritmo de Butcher (Meeus/Jones/Butcher) para calcular el Domingo de Pascua
 */
function getEasterDate(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function padZero(num: number): string {
  return String(num).padStart(2, '0');
}

/**
 * Genera todos los feriados y días festivos de México para un año determinado.
 */
export function getFeriadosMexicoPorAno(year: number): FeriadoCalculado[] {
  const feriados: FeriadoCalculado[] = [];

  const add = (
    m: number,
    d: number,
    descripcion: string,
    categoria: 'oficial_lft' | 'civica_historica' | 'tradicional',
    esDescansoObligatorio: boolean
  ) => {
    feriados.push({
      fecha: `${year}-${padZero(m)}-${padZero(d)}`,
      tipo: 'feriado',
      descripcion,
      categoria,
      esDescansoObligatorio,
    });
  };

  // 1. Año Nuevo (Fijo)
  add(1, 1, 'Año Nuevo', 'oficial_lft', true);

  // 2. Día de la Constitución
  const primerLunesFeb = getNthDayOfMonth(year, 2, 1, 1);
  add(2, primerLunesFeb, 'Día de la Constitución (Puente oficial LFT)', 'oficial_lft', true);
  if (primerLunesFeb !== 5) {
    add(2, 5, 'Aniversario de la Constitución Mexicana (Fecha cívica)', 'civica_historica', false);
  }

  // 3. Natalicio de Benito Juárez
  const tercerLunesMar = getNthDayOfMonth(year, 3, 1, 3);
  add(3, tercerLunesMar, 'Natalicio de Benito Juárez (Puente oficial LFT)', 'oficial_lft', true);
  if (tercerLunesMar !== 21) {
    add(3, 21, 'Natalicio de Benito Juárez (Fecha cívica)', 'civica_historica', false);
  }

  // 4. Semana Santa (Jueves y Viernes Santo)
  const easter = getEasterDate(year);
  const domingoPascua = new Date(year, easter.month - 1, easter.day);
  const juevesSanto = new Date(domingoPascua);
  juevesSanto.setDate(domingoPascua.getDate() - 3);
  const viernesSanto = new Date(domingoPascua);
  viernesSanto.setDate(domingoPascua.getDate() - 2);

  add(juevesSanto.getMonth() + 1, juevesSanto.getDate(), 'Jueves Santo', 'tradicional', false);
  add(viernesSanto.getMonth() + 1, viernesSanto.getDate(), 'Viernes Santo', 'tradicional', false);

  // 5. Día del Trabajo (Fijo)
  add(5, 1, 'Día del Trabajo', 'oficial_lft', true);

  // 6. Día de la Independencia (Fijo)
  add(9, 16, 'Día de la Independencia de México', 'oficial_lft', true);

  // 7. Transmisión del Poder Ejecutivo Federal (Cada 6 años el 1 de octubre, a partir de 2024: 2024, 2030, 2036...)
  if ((year - 2024) % 6 === 0) {
    add(10, 1, 'Transmisión del Poder Ejecutivo Federal', 'oficial_lft', true);
  }

  // 8. Día de Muertos (Tradicional festivo)
  add(11, 2, 'Día de Muertos', 'tradicional', false);

  // 9. Revolución Mexicana
  const tercerLunesNov = getNthDayOfMonth(year, 11, 1, 3);
  add(11, tercerLunesNov, 'Revolución Mexicana (Puente oficial LFT)', 'oficial_lft', true);
  if (tercerLunesNov !== 20) {
    add(11, 20, 'Día de la Revolución Mexicana (Fecha oficial histórica)', 'civica_historica', false);
  }

  // 10. Día de la Virgen de Guadalupe (Tradicional)
  add(12, 12, 'Día de la Virgen de Guadalupe', 'tradicional', false);

  // 11. Navidad (Fijo)
  add(12, 25, 'Navidad', 'oficial_lft', true);

  return feriados;
}

/**
 * Obtiene los feriados calculados para un mes y año específicos.
 */
export function getFeriadosMexicoPorMes(year: number, month: number): FeriadoCalculado[] {
  const monthStr = padZero(month);
  const prefix = `${year}-${monthStr}-`;
  return getFeriadosMexicoPorAno(year).filter((f) => f.fecha.startsWith(prefix));
}
