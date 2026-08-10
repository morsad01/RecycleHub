import { useState } from 'react';
import type { CourierProvider } from '../types/delivery.types';
import { Truck, Package, Bike } from 'lucide-react';

interface DeliveryPartnerSelectorProps {
  value: CourierProvider;
  onChange: (value: CourierProvider) => void;
  availablePartners?: CourierProvider[];
}

export function DeliveryPartnerSelector({ value, onChange, availablePartners = ['pathao', 'redx', 'manual'] }: DeliveryPartnerSelectorProps) {
  const partners = [
    { id: 'pathao', name: 'Pathao Courier', icon: Bike, desc: 'Fast local & nationwide' },
    { id: 'redx', name: 'RedX', icon: Truck, desc: 'Reliable parcel delivery' },
    { id: 'steadfast', name: 'SteadFast', icon: Truck, desc: 'E-commerce focused' },
    { id: 'paperfly', name: 'Paperfly', icon: Package, desc: 'Door-to-door network' },
    { id: 'manual', name: 'Manual / Self Delivery', icon: Package, desc: 'Arrange your own delivery' },
  ].filter(p => availablePartners.includes(p.id as CourierProvider));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {partners.map((partner) => {
        const Icon = partner.icon;
        const isSelected = value === partner.id;
        return (
          <button
            key={partner.id}
            type="button"
            onClick={() => onChange(partner.id as CourierProvider)}
            className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
              isSelected
                ? 'border-primary-500 bg-primary-50 shadow-sm ring-1 ring-primary-500'
                : 'border-neutral-200 bg-white hover:border-primary-300'
            }`}
          >
            <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 text-neutral-500'}`}>
              <Icon size={20} />
            </div>
            <div>
              <div className="font-semibold text-neutral-900">{partner.name}</div>
              <div className="text-sm text-neutral-500 mt-0.5">{partner.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
