import { CheckCircle2, Clock, Truck, Package, PackageCheck, AlertCircle } from 'lucide-react';
import type { DeliveryDetails, DeliveryTimelineEvent } from '../types/delivery.types';

interface DeliveryTimelineProps {
  details: DeliveryDetails;
}

export function DeliveryTimeline({ details }: DeliveryTimelineProps) {
  const getStatusIcon = (status: DeliveryTimelineEvent['status']) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'picked_up': return <Package size={16} />;
      case 'in_transit': return <Truck size={16} />;
      case 'out_for_delivery': return <PackageCheck size={16} />;
      case 'delivered': return <CheckCircle2 size={16} />;
      case 'failed': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusColor = (status: DeliveryTimelineEvent['status']) => {
    switch (status) {
      case 'delivered': return 'bg-success-500 text-white border-success-500';
      case 'failed': return 'bg-error-500 text-white border-error-500';
      default: return 'bg-primary-500 text-white border-primary-500';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-neutral-900">Delivery Tracking</h3>
          <p className="text-sm text-neutral-500">Tracking: {details.trackingNumber}</p>
        </div>
        <div className="px-3 py-1 bg-neutral-100 rounded-full text-sm font-medium text-neutral-700 capitalize">
          Via {details.provider}
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-neutral-200">
        {details.timeline.map((event, index) => {
          const isLast = index === 0; // Assuming timeline is sorted newest first
          return (
            <div key={index} className="relative flex items-center md:justify-center">
              <div className={`absolute left-0 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white ${
                isLast ? getStatusColor(event.status) : 'border-neutral-300 text-neutral-400'
              }`}>
                {getStatusIcon(event.status)}
              </div>
              <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:ml-auto'} pl-8 md:pl-0`}>
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 shadow-sm">
                  <h4 className="font-semibold text-neutral-900 capitalize">{event.status.replace(/_/g, ' ')}</h4>
                  <p className="text-sm text-neutral-500 mt-1">{new Date(event.timestamp).toLocaleString()}</p>
                  {event.description && <p className="text-sm text-neutral-700 mt-2">{event.description}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
