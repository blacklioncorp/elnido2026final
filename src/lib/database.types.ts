export type UserRole = 'guardian' | 'admin' | 'super_admin'
export type AdminRole = 'superadmin' | 'editor' | 'cuidador' | 'cajero'

export type TipoTarjeta = 'especie' | 'animal_individual' | 'familia'
export type MetaTipo = 'unica' | 'mensual' | 'anual'
export type OrigenDonacion = 'donar' | 'donativos'
export type FaunaTipo = 'ave' | 'mamifero' | 'reptil' | 'felino' | 'primate' | 'otro'
export type BitacoraVisibilidad = 'publico' | 'padrinos' | 'mixto'
export type BitacoraEstado = 'borrador' | 'revision' | 'publicado' | 'rechazado'

export type Database = {
  public: {
    Tables: {
      admin_roles: {
        Row: {
          id: AdminRole
          label: string
          permisos: string[]
        }
        Insert: {
          id: AdminRole
          label: string
          permisos?: string[]
        }
        Update: {
          label?: string
          permisos?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          role: UserRole
          full_name: string | null
          avatar_url: string | null
          created_at: string
          admin_role: AdminRole | null
          email: string | null
          activo: boolean
        }
        Insert: {
          id: string
          role?: UserRole
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          admin_role?: AdminRole | null
          email?: string | null
          activo?: boolean
        }
        Update: {
          role?: UserRole
          full_name?: string | null
          avatar_url?: string | null
          admin_role?: AdminRole | null
          email?: string | null
          activo?: boolean
        }
        Relationships: []
      }
      fauna: {
        Row: {
          id: string
          nombre: string
          nombre_cientifico: string | null
          slug: string
          tipo: FaunaTipo
          descripcion: string | null
          historia: string | null
          imagen_url: string | null
          galeria: string[]
          activo: boolean
          created_at: string
          updated_at: string
          seccion?: string | null
          latitud_origen?: number | null
          longitud_origen?: number | null
          latitud_destino?: number | null
          longitud_destino?: number | null
          area_protegida?: string | null
          latitud_actual?: number | null
          longitud_actual?: number | null
          liberada?: boolean | null
        }
        Insert: {
          id?: string
          nombre: string
          nombre_cientifico?: string | null
          slug: string
          tipo: FaunaTipo
          descripcion?: string | null
          historia?: string | null
          imagen_url?: string | null
          galeria?: string[]
          activo?: boolean
          created_at?: string
          updated_at?: string
          seccion?: string | null
          latitud_origen?: number | null
          longitud_origen?: number | null
          latitud_destino?: number | null
          longitud_destino?: number | null
          area_protegida?: string | null
          latitud_actual?: number | null
          longitud_actual?: number | null
          liberada?: boolean | null
        }
        Update: {
          nombre?: string
          nombre_cientifico?: string | null
          slug?: string
          tipo?: FaunaTipo
          descripcion?: string | null
          historia?: string | null
          imagen_url?: string | null
          galeria?: string[]
          activo?: boolean
          updated_at?: string
          seccion?: string | null
          latitud_origen?: number | null
          longitud_origen?: number | null
          latitud_destino?: number | null
          longitud_destino?: number | null
          area_protegida?: string | null
          latitud_actual?: number | null
          longitud_actual?: number | null
          liberada?: boolean | null
        }
        Relationships: []
      }
      bitacora: {
        Row: {
          id: string
          fauna_id: string | null
          autor_id: string
          titulo: string
          contenido: string
          imagen_url: string | null
          video_url: string | null
          visibilidad: BitacoraVisibilidad
          estado: BitacoraEstado
          revisor_id: string | null
          comentario_revision: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          fauna_id?: string | null
          autor_id: string
          titulo: string
          contenido: string
          imagen_url?: string | null
          video_url?: string | null
          visibilidad?: BitacoraVisibilidad
          estado?: BitacoraEstado
          revisor_id?: string | null
          comentario_revision?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          fauna_id?: string | null
          titulo?: string
          contenido?: string
          imagen_url?: string | null
          video_url?: string | null
          visibilidad?: BitacoraVisibilidad
          estado?: BitacoraEstado
          revisor_id?: string | null
          comentario_revision?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitacora_fauna_id_fkey"
            columns: ["fauna_id"]
            isOneToOne: false
            referencedRelation: "fauna"
            referencedColumns: ["id"]
          }
        ]
      }
      blog: {
        Row: {
          id: string
          titulo: string
          slug: string
          contenido: string
          excerpt: string | null
          imagen_url: string | null
          autor_id: string | null
          publicado: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titulo: string
          slug: string
          contenido?: string
          excerpt?: string | null
          imagen_url?: string | null
          autor_id?: string | null
          publicado?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          titulo?: string
          slug?: string
          contenido?: string
          excerpt?: string | null
          imagen_url?: string | null
          publicado?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      sponsorships: {
        Row: {
          id: string
          user_id: string
          species_id: string
          monthly_amount: number
          stripe_subscription_id: string | null
          status: 'active' | 'paused' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          species_id: string
          monthly_amount: number
          stripe_subscription_id?: string | null
          status?: 'active' | 'paused' | 'cancelled'
          created_at?: string
        }
        Update: {
          status?: 'active' | 'paused' | 'cancelled'
          stripe_subscription_id?: string | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          id: string
          user_id: string | null
          amount: number
          currency: string
          stripe_payment_intent_id: string | null
          species_id: string | null
          message: string | null
          status: 'pending' | 'succeeded' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          amount: number
          currency?: string
          stripe_payment_intent_id?: string | null
          species_id?: string | null
          message?: string | null
          status?: 'pending' | 'succeeded' | 'failed'
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'succeeded' | 'failed'
          stripe_payment_intent_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          id: string
          slug: string
          title: string
          excerpt: string | null
          content: string | null
          author_id: string | null
          image_url: string | null
          category: string | null
          read_time: number | null
          published: boolean
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          excerpt?: string | null
          content?: string | null
          author_id?: string | null
          image_url?: string | null
          category?: string | null
          read_time?: number | null
          published?: boolean
          published_at?: string | null
          created_at?: string
        }
        Update: {
          slug?: string
          title?: string
          excerpt?: string | null
          content?: string | null
          image_url?: string | null
          category?: string | null
          read_time?: number | null
          published?: boolean
          published_at?: string | null
        }
        Relationships: []
      }
      field_journal: {
        Row: {
          id: string
          title: string
          description: string | null
          author_id: string | null
          zone: string | null
          species_id: string | null
          image_url: string | null
          observed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          author_id?: string | null
          zone?: string | null
          species_id?: string | null
          image_url?: string | null
          observed_at?: string
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          zone?: string | null
          species_id?: string | null
          image_url?: string | null
          observed_at?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          id: string
          email: string
          nombre: string
          telefono: string | null
          acepta_whatsapp: boolean
          acepta_newsletter: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          nombre: string
          telefono?: string | null
          acepta_whatsapp?: boolean
          acepta_newsletter?: boolean
          created_at?: string
        }
        Update: {
          email?: string
          nombre?: string
          telefono?: string | null
          acepta_whatsapp?: boolean
          acepta_newsletter?: boolean
        }
        Relationships: []
      }
      tipos_producto: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          precio: number
          categoria: 'entrada' | 'evento' | 'membresia' | 'paquete_familiar'
          activo: boolean
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          precio?: number
          categoria: 'entrada' | 'evento' | 'membresia' | 'paquete_familiar'
          activo?: boolean
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          nombre?: string
          descripcion?: string | null
          precio?: number
          categoria?: 'entrada' | 'evento' | 'membresia' | 'paquete_familiar'
          activo?: boolean
          metadata?: Record<string, unknown>
        }
        Relationships: []
      }
      compras: {
        Row: {
          id: string
          cliente_id: string | null
          tipo_producto_id: string | null
          stripe_session_id: string | null
          total: number
          estado: 'pendiente' | 'completado' | 'activado' | 'expirado' | 'cancelado'
          membresia_inicio: string | null
          membresia_fin: string | null
          saldo_actual: number
          rfid_uid: string | null
          descuento_eventos: number | null
          qr_code: string | null
          fecha_visita: string | null
          cantidad_personas: number
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          cliente_id?: string | null
          tipo_producto_id?: string | null
          stripe_session_id?: string | null
          total: number
          estado?: 'pendiente' | 'completado' | 'activado' | 'expirado' | 'cancelado'
          membresia_inicio?: string | null
          membresia_fin?: string | null
          saldo_actual?: number
          rfid_uid?: string | null
          descuento_eventos?: number | null
          qr_code?: string | null
          fecha_visita?: string | null
          cantidad_personas?: number
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          estado?: 'pendiente' | 'completado' | 'activado' | 'expirado' | 'cancelado'
          membresia_inicio?: string | null
          membresia_fin?: string | null
          saldo_actual?: number
          rfid_uid?: string | null
          descuento_eventos?: number | null
          qr_code?: string | null
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_tipo_producto_id_fkey"
            columns: ["tipo_producto_id"]
            isOneToOne: false
            referencedRelation: "tipos_producto"
            referencedColumns: ["id"]
          }
        ]
      }
      compra_items: {
        Row: {
          id: string
          compra_id: string | null
          tipo_producto_id: string | null
          nombre: string
          cantidad: number
          precio_unitario: number
          categoria: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          compra_id?: string | null
          tipo_producto_id?: string | null
          nombre: string
          cantidad?: number
          precio_unitario: number
          categoria?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          cantidad?: number
          precio_unitario?: number
          metadata?: Record<string, unknown>
        }
        Relationships: [
          {
            foreignKeyName: "compra_items_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compra_items_tipo_producto_id_fkey"
            columns: ["tipo_producto_id"]
            isOneToOne: false
            referencedRelation: "tipos_producto"
            referencedColumns: ["id"]
          }
        ]
      }
      cajas: {
        Row: {
          id: string
          nombre: string
          nip: string
          activa: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          nip: string
          activa?: boolean
          created_at?: string
        }
        Update: {
          nombre?: string
          nip?: string
          activa?: boolean
        }
        Relationships: []
      }
      productos_pos: {
        Row: {
          id: string
          nombre: string
          precio: number
          activo: boolean
          categoria: string
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          precio: number
          activo?: boolean
          categoria?: string
          created_at?: string
        }
        Update: {
          nombre?: string
          precio?: number
          activo?: boolean
          categoria?: string
        }
        Relationships: []
      }
      ventas_pos: {
        Row: {
          id: string
          caja_id: string | null
          cliente_id: string | null
          total: number
          metodo_pago: string
          created_at: string
        }
        Insert: {
          id?: string
          caja_id?: string | null
          cliente_id?: string | null
          total: number
          metodo_pago: string
          created_at?: string
        }
        Update: {
          total?: number
          metodo_pago?: string
        }
        Relationships: [
          {
            foreignKeyName: "ventas_pos_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "cajas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_pos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          }
        ]
      }
      venta_detalles: {
        Row: {
          id: string
          venta_id: string
          producto_id: string | null
          descripcion: string | null
          cantidad: number
          precio_unitario: number
        }
        Insert: {
          id?: string
          venta_id: string
          producto_id?: string | null
          descripcion?: string | null
          cantidad: number
          precio_unitario: number
        }
        Update: {
          cantidad?: number
          precio_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "venta_detalles_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas_pos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_detalles_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos_pos"
            referencedColumns: ["id"]
          }
        ]
      }
      campanas: {
        Row: {
          id: string
          nombre: string
          codigo_descuento: string | null
          porcentaje_descuento: number | null
          regalo: string | null
          limite_regalos: number | null
          regalos_entregados: number
          activa: boolean
          fecha_inicio: string | null
          fecha_fin: string | null
        }
        Insert: {
          id?: string
          nombre: string
          codigo_descuento?: string | null
          porcentaje_descuento?: number | null
          regalo?: string | null
          limite_regalos?: number | null
          regalos_entregados?: number
          activa?: boolean
          fecha_inicio?: string | null
          fecha_fin?: string | null
        }
        Update: {
          activa?: boolean
          regalos_entregados?: number
        }
        Relationships: []
      }
      actualizaciones_liberacion: {
        Row: {
          id: string
          tarjeta_id: string | null
          fecha: string
          titulo: string
          descripcion: string
          latitud: number | null
          longitud: number | null
          imagen_url: string | null
          es_destacada: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          tarjeta_id?: string | null
          fecha?: string
          titulo: string
          descripcion: string
          latitud?: number | null
          longitud?: number | null
          imagen_url?: string | null
          es_destacada?: boolean | null
          created_at?: string
        }
        Update: {
          tarjeta_id?: string | null
          fecha?: string
          titulo?: string
          descripcion?: string
          latitud?: number | null
          longitud?: number | null
          imagen_url?: string | null
          es_destacada?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "actualizaciones_liberacion_tarjeta_id_fkey"
            columns: ["tarjeta_id"]
            referencedRelation: "tarjetas_donacion"
            referencedColumns: ["id"]
          }
        ]
      }
      tarjetas_donacion: {
        Row: {
          id: string
          nombre_especie: string
          nombre_animal: string | null
          tipo: TipoTarjeta
          descripcion: string
          historia: string | null
          imagen_url: string | null
          meta_tipo: MetaTipo
          meta_monto: number
          monto_recaudado: number
          activa: boolean
          meta_cumplida: boolean
          stripe_product_id: string | null
          vistas: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre_especie: string
          nombre_animal?: string | null
          tipo: TipoTarjeta
          descripcion: string
          historia?: string | null
          imagen_url?: string | null
          meta_tipo: MetaTipo
          meta_monto: number
          monto_recaudado?: number
          activa?: boolean
          meta_cumplida?: boolean
          stripe_product_id?: string | null
          vistas?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          nombre_especie?: string
          nombre_animal?: string | null
          tipo?: TipoTarjeta
          descripcion?: string
          historia?: string | null
          imagen_url?: string | null
          meta_tipo?: MetaTipo
          meta_monto?: number
          monto_recaudado?: number
          activa?: boolean
          meta_cumplida?: boolean
          stripe_product_id?: string | null
          vistas?: number
          updated_at?: string
        }
        Relationships: []
      }
      donaciones: {
        Row: {
          id: string
          tarjeta_id: string | null
          donante_nombre: string
          donante_email: string
          donante_username: string | null
          monto: number
          stripe_session_id: string | null
          stripe_subscription_id?: string | null
          estado_suscripcion?: string | null
          mensaje: string | null
          origen: OrigenDonacion
          es_recurrente?: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          tarjeta_id?: string | null
          donante_nombre: string
          donante_email: string
          donante_username?: string | null
          monto: number
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          estado_suscripcion?: string | null
          mensaje?: string | null
          origen?: OrigenDonacion
          es_recurrente?: boolean | null
          created_at?: string
        }
        Update: {
          tarjeta_id?: string | null
          donante_nombre?: string
          donante_email?: string
          donante_username?: string | null
          monto?: number
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          estado_suscripcion?: string | null
          mensaje?: string | null
          origen?: OrigenDonacion
          es_recurrente?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "donaciones_tarjeta_id_fkey"
            columns: ["tarjeta_id"]
            referencedRelation: "tarjetas_donacion"
            referencedColumns: ["id"]
          }
        ]
      }
      cupo_diario: {
        Row: {
          id: string
          fecha: string
          cupo_maximo: number
          lugares_ocupados: number
          created_at: string
        }
        Insert: {
          id?: string
          fecha: string
          cupo_maximo?: number
          lugares_ocupados?: number
          created_at?: string
        }
        Update: {
          cupo_maximo?: number
          lugares_ocupados?: number
        }
        Relationships: []
      }
      configuracion: {
        Row: {
          clave: string
          valor: string | null
          updated_at: string
        }
        Insert: {
          clave: string
          valor?: string | null
          updated_at?: string
        }
        Update: {
          valor?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      paquetes_educativos: {
        Row: {
          id: string
          nombre: string
          slug: string
          nivel: 'preescolar' | 'primaria' | 'secundaria' | 'preparatoria' | 'licenciatura'
          duracion_horas: number
          precio_por_persona: number
          min_personas: number
          max_personas: number
          descripcion: string
          que_incluye: string[] | null
          que_no_incluye: string[] | null
          itinerario: any[] | null
          instalaciones: string[] | null
          alineacion_sep: string[] | null
          incluye_transporte: boolean
          precio_transporte: number | null
          incluye_lunch: boolean
          precio_lunch: number | null
          imagen_url: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: any
        Update: any
        Relationships: []
      }
      cotizaciones: {
        Row: {
          id: string
          paquete_id: string
          cliente_nombre: string
          cliente_email: string
          cliente_telefono: string | null
          escuela: string | null
          personas: number
          fecha_deseada: string
          incluye_lunch: boolean
          incluye_transporte: boolean
          total_estimado: number
          estado: 'pendiente' | 'respondida' | 'confirmada' | 'cancelada'
          mensaje: string | null
          created_at: string
          updated_at: string
        }
        Insert: any
        Update: any
        Relationships: [
          {
            foreignKeyName: "cotizaciones_paquete_id_fkey"
            columns: ["paquete_id"]
            referencedRelation: "paquetes_educativos"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      incrementar_regalo: {
        Args: { p_codigo: string }
        Returns: boolean
      }
      consultar_disponibilidad: {
        Args: { fecha_consulta: string }
        Returns: Array<{
          fecha: string
          cupo_maximo: number
          lugares_ocupados: number
          disponibles: number
        }>
      }
      incrementar_cupo: {
        Args: { p_fecha: string; p_cantidad: number }
        Returns: undefined
      }
      reiniciar_metas_programadas: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
