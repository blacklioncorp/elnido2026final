'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Ticket, CalendarDays, ShoppingCart, Shield, PartyPopper, Tag } from 'lucide-react';
import TiposEntradaTab from '@/components/admin/boletos/TiposEntradaTab';
import MembresiasTab from '@/components/admin/boletos/MembresiasTab';
import DiasVentaTab from '@/components/admin/boletos/DiasVentaTab';
import EventosTab from '@/components/admin/boletos/EventosTab';
import VentasTab from '@/components/admin/boletos/VentasTab';
import DescuentosTab from '@/components/admin/boletos/DescuentosTab';

export default function BoletosAdminClient() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'entradas' | 'membresias' | 'dias_venta' | 'eventos' | 'descuentos' | 'ventas' | null;
  const searchParam = searchParams.get('search') || '';

  const [activeTab, setActiveTab] = useState<'entradas' | 'membresias' | 'dias_venta' | 'eventos' | 'descuentos' | 'ventas'>(
    tabParam || 'entradas'
  );

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  
  const tabs = [
    { id: 'entradas' as const, label: 'Tipos de Entrada', icon: Ticket },
    { id: 'membresias' as const, label: 'Membresías Guardián', icon: Shield },
    { id: 'dias_venta' as const, label: 'Días de Venta', icon: CalendarDays },
    { id: 'eventos' as const, label: 'Eventos', icon: PartyPopper },
    { id: 'descuentos' as const, label: 'Códigos de Descuento', icon: Tag },
    { id: 'ventas' as const, label: 'Ventas', icon: ShoppingCart },
  ];
  
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-off-white flex items-center gap-3">
          <Ticket className="h-7 w-7 text-conservation-gold" />
          Administración de Boletos
        </h1>
        <p className="text-sm text-off-white/60 mt-1">
          Gestiona las tarifas de admisión, membresías Guardián, días habilitados para venta, eventos temáticos especiales, códigos de descuento y supervisa las compras online.
        </p>
      </div>
      
      {/* Selector de Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-white/10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-conservation-gold text-forest-green-dark shadow-lg shadow-yellow-500/10'
                : 'bg-white/5 text-off-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Contenido de la pestaña activa */}
      <div className="pt-2">
        {activeTab === 'entradas' && <TiposEntradaTab />}
        {activeTab === 'membresias' && <MembresiasTab />}
        {activeTab === 'dias_venta' && <DiasVentaTab />}
        {activeTab === 'eventos' && <EventosTab />}
        {activeTab === 'descuentos' && <DescuentosTab />}
        {activeTab === 'ventas' && <VentasTab initialSearch={searchParam} />}
      </div>
    </div>
  );
}
