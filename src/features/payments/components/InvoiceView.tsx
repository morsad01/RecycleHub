import { FileText, Download } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nContext';
import type { Order } from '../../../types';

interface InvoiceViewProps {
  order: Order;
}

export function InvoiceView({ order }: InvoiceViewProps) {
  const { t } = useI18n();

  const handleDownload = () => {
    // In production, this would generate a PDF and trigger download.
    // We mock the download action here.
    const element = document.createElement('a');
    const file = new Blob([`Invoice for Order #${order.id}\nTotal: ৳${order.total_amount}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Invoice_${order.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900">Invoice #{order.id.slice(0, 8).toUpperCase()}</h3>
            <p className="text-sm text-neutral-500">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-lg transition-colors"
        >
          <Download size={16} />
          <span className="hidden sm:inline">{t('payment.downloadInvoice') || 'Download'}</span>
        </button>
      </div>

      <div className="border-t border-neutral-100 pt-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">Subtotal</span>
          <span className="font-medium text-neutral-900">৳{(order.total_amount - order.delivery_charge).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Delivery Fee</span>
          <span className="font-medium text-neutral-900">৳{order.delivery_charge.toLocaleString()}</span>
        </div>
        <div className="flex justify-between pt-3 border-t border-dashed border-neutral-200 text-base">
          <span className="font-bold text-neutral-900">Total Paid</span>
          <span className="font-bold text-primary-600">৳{order.total_amount.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-neutral-100">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
          Paid via {order.payment_method?.toUpperCase() || 'COD'}
        </span>
      </div>
    </div>
  );
}
