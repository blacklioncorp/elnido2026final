'use server'

import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

const CONFIG_KEYS = [
  'whatsapp_numero',
  'whatsapp_mensaje',
  'n8n_webhook_url',
  'video_testimonial_url',
] as const

type ConfigKey = (typeof CONFIG_KEYS)[number]

export async function getConfiguracion(): Promise<Record<string, string>> {
  const supabase = await createAdminSupabaseClient()
  const { data } = await supabase
    .from('configuracion')
    .select('clave, valor')
    .in('clave', CONFIG_KEYS as unknown as string[])

  const result: Record<string, string> = {}
  for (const row of data ?? []) {
    result[row.clave] = row.valor ?? ''
  }
  return result
}

export async function saveConfiguracion(
  key: ConfigKey,
  value: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createAdminSupabaseClient()

  const { error } = await supabase
    .from('configuracion')
    .upsert(
      { clave: key, valor: value, updated_at: new Date().toISOString() },
      { onConflict: 'clave' },
    )

  if (error) return { error: error.message }
  revalidatePath('/admin/configuracion')
  return { success: true }
}
