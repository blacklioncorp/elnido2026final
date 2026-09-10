import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const { qr_code } = await request.json()

    if (!qr_code) {
      return NextResponse.json({ valido: false, mensaje: 'Código QR no proporcionado' }, { status: 400 })
    }

    const admin = await createAdminSupabaseClient()

    // 1. Buscar la compra por QR
    const { data: compra, error } = await admin
      .from('compras')
      .select('id, estado, fecha_visita, cantidad_personas, tipo_producto_id, cliente_id, tipos_producto(nombre, categoria), clientes(nombre, email)')
      .eq('qr_code', qr_code)
      .maybeSingle()

    if (error || !compra) {
      return NextResponse.json({ valido: false, mensaje: 'QR no encontrado' })
    }

    if (compra.estado === 'activado') {
      return NextResponse.json({ valido: false, mensaje: 'Este QR ya fue utilizado' })
    }

    if (compra.estado === 'completado') {
      // 2. Marcar como utilizado (activado)
      const { error: updateError } = await admin
        .from('compras')
        .update({ estado: 'activado' })
        .eq('id', compra.id)

      if (updateError) {
        return NextResponse.json({ valido: false, mensaje: 'Error al actualizar el estado del QR' }, { status: 500 })
      }

      // 3. Obtener el nombre del producto y cliente con cuidado de las relaciones
      let nombreProducto = 'Boleto'
      let categoriaProducto = 'entrada'
      if (compra.tipos_producto) {
        // En supabase con join simple (isOneToOne = false) puede devolver array u objeto
        const tipoProd = Array.isArray(compra.tipos_producto) ? compra.tipos_producto[0] : compra.tipos_producto
        if (tipoProd) {
          nombreProducto = tipoProd.nombre
          categoriaProducto = tipoProd.categoria
        }
      }

      let nombreCliente = 'Cliente sin nombre'
      let emailCliente = 'Sin correo'
      if (compra.clientes) {
        const cl = Array.isArray(compra.clientes) ? compra.clientes[0] : compra.clientes
        if (cl) {
          nombreCliente = cl.nombre
          emailCliente = cl.email
        }
      }

      return NextResponse.json({
        valido: true,
        datos: {
          nombre: nombreCliente,
          email: emailCliente,
          tipo_producto: nombreProducto,
          categoria: categoriaProducto,
          fecha_visita: compra.fecha_visita,
          cantidad_personas: compra.cantidad_personas
        }
      })
    }

    // Para cualquier otro estado (pendiente, expirado, cancelado)
    return NextResponse.json({ valido: false, mensaje: `QR inválido (Estado: ${compra.estado})` })

  } catch (error: any) {
    console.error('Error validando QR:', error)
    return NextResponse.json(
      { valido: false, mensaje: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
