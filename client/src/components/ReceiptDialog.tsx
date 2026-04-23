import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import type { Order, BusinessSettings } from "@/lib/db";

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  business: BusinessSettings | null;
}

function fmtDate(date: Date) {
  return new Intl.DateTimeFormat('en-GH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  }).format(date);
}

function fmtMoney(amount: number) {
  return `GH₵ ${Math.abs(amount).toFixed(2)}`;
}

function PaymentLabel(method: string) {
  switch (method) {
    case 'momo': return 'Mobile Money (MoMo)';
    case 'card': return 'Card';
    case 'credit': return 'Credit';
    default: return 'Cash';
  }
}

const DIVIDER = "- - - - - - - - - - - - - - - - - -";
const THICK_DIVIDER = "════════════════════════════════";

export default function ReceiptDialog({ open, onClose, order, business }: ReceiptDialogProps) {
  if (!order) return null;

  const isRefund = order.status === 'refunded' || order.status === 'cancelled';
  const cashPay = order.paymentMethods.find(p => p.method === 'cash');
  const changeDue = cashPay && !isRefund && cashPay.amount > order.total
    ? cashPay.amount - order.total : 0;
  const itemCount = order.items.reduce((sum, it) => sum + Math.abs(it.quantity), 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm p-0 gap-0 overflow-hidden rounded-xl">
        <div className="flex gap-2 p-3 border-b bg-muted/30 print:hidden">
          <Button onClick={() => window.print()} className="flex-1 gap-2" size="sm">
            <Printer className="size-4" /> Print Receipt
          </Button>
          <Button variant="outline" onClick={onClose} size="sm" className="gap-2">
            <X className="size-4" /> Close
          </Button>
        </div>

        <div id="receipt-print-area" className="px-5 py-4 max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible">
          <div className="receipt-mono text-[13px] leading-relaxed">

            <div className="text-center mb-1">
              {business?.businessName ? (
                <p className="text-base font-black uppercase tracking-wider mb-0.5">{business.businessName}</p>
              ) : (
                <p className="text-base font-black uppercase tracking-wider mb-0.5">RECEIPT</p>
              )}
              {business?.address && <p className="text-[11px] opacity-70">{business.address}</p>}
              {business?.phone && <p className="text-[11px] opacity-70">Tel: {business.phone}</p>}
              {business?.email && <p className="text-[11px] opacity-70">{business.email}</p>}
            </div>

            <p className="text-center text-[10px] opacity-40 my-1">{THICK_DIVIDER}</p>

            <div className="text-center mb-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em]">
                {isRefund ? (order.status === 'refunded' ? '*** REFUND ***' : '*** RETURN ***') : 'SALES RECEIPT'}
              </p>
            </div>

            <div className="flex justify-between text-[11px] opacity-80">
              <span>Receipt #:</span>
              <span className="font-semibold">{order.id ? String(order.id).padStart(6, '0') : '------'}</span>
            </div>
            <div className="flex justify-between text-[11px] opacity-80 mb-1">
              <span>Date:</span>
              <span>{fmtDate(order.createdAt)}</span>
            </div>

            <p className="text-center text-[10px] opacity-40 my-1">{DIVIDER}</p>

            <div className="space-y-2 my-2">
              {order.items.map((item, i) => {
                const qty = Math.abs(item.quantity);
                const disc = item.discount || 0;
                const net = item.price - disc;
                const lineTotal = net * qty;
                return (
                  <div key={i}>
                    <p className="font-semibold break-words">{item.name}</p>
                    <div className="flex justify-between text-[11px] pl-2">
                      <span>
                        {qty} × {fmtMoney(item.price)}
                        {disc > 0 && <span className="opacity-60"> (-{fmtMoney(disc)})</span>}
                      </span>
                      <span className="font-medium">{fmtMoney(lineTotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-[10px] opacity-40 my-1">{DIVIDER}</p>

            <div className="space-y-0.5 text-[12px]">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                <span>{fmtMoney(order.subtotal)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount{order.discountType === 'percentage' ? ' (%)' : ''}</span>
                  <span>- {fmtMoney(order.discount)}</span>
                </div>
              )}

              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax{order.taxRuleName ? ` (${order.taxRuleName})` : ''}</span>
                  <span>{fmtMoney(order.tax)}</span>
                </div>
              )}
            </div>

            <p className="text-center text-[10px] opacity-40 my-1">{THICK_DIVIDER}</p>

            <div className="flex justify-between items-center text-lg font-black my-1">
              <span>TOTAL</span>
              <span>{isRefund ? '-' : ''}{fmtMoney(order.total)}</span>
            </div>

            <p className="text-center text-[10px] opacity-40 my-1">{THICK_DIVIDER}</p>

            <div className="space-y-0.5 text-[12px] my-1">
              <p className="font-bold text-[11px] uppercase tracking-wider mb-0.5">Payment</p>
              {order.paymentMethods.map((p, i) => (
                <div key={i} className="flex justify-between">
                  <span>{PaymentLabel(p.method)}{isRefund ? ' (Refund)' : ''}</span>
                  <span>{isRefund ? '-' : ''}{fmtMoney(p.amount)}</span>
                </div>
              ))}
              {changeDue > 0 && (
                <div className="flex justify-between font-bold mt-1 pt-1 border-t border-dashed">
                  <span>CHANGE DUE</span>
                  <span>{fmtMoney(changeDue)}</span>
                </div>
              )}
            </div>

            <p className="text-center text-[10px] opacity-40 my-2">{DIVIDER}</p>

            <div className="text-center space-y-0.5 text-[11px] opacity-70">
              <p className="font-medium">Thank you for your patronage!</p>
              <p>Goods sold in good condition are not returnable.</p>
              {business?.businessName && <p className="font-semibold">{business.businessName}</p>}
              <p className="text-[10px] mt-1 opacity-50">Powered by Shawama Boss</p>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
