'use server'

import { gestionarSuscripcionGuardian } from './guardian'
import { notificarErrorAdmin } from '@/lib/notifications'

export async function cancelarDonacion(donacionId: string) {
  try {
    return await gestionarSuscripcionGuardian(donacionId, 'cancelar')
  } catch (err) {
    await notificarErrorAdmin(err, 'gestión de donación - cancelar')
    throw err
  }
}

export async function pausarDonacion(donacionId: string) {
  try {
    return await gestionarSuscripcionGuardian(donacionId, 'pausar')
  } catch (err) {
    await notificarErrorAdmin(err, 'gestión de donación - pausar')
    throw err
  }
}

export async function reanudarDonacion(donacionId: string) {
  try {
    return await gestionarSuscripcionGuardian(donacionId, 'reanudar')
  } catch (err) {
    await notificarErrorAdmin(err, 'gestión de donación - reanudar')
    throw err
  }
}
