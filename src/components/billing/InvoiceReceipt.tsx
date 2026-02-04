import { useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface InvoiceReceiptProps {
    receipt: any;
    onClose: () => void;
    onPrint?: () => void;
    autoPrint?: boolean;
}

export default function InvoiceReceipt({ receipt, onClose, onPrint, autoPrint }: InvoiceReceiptProps) {
    const printInIframe = (printNode: HTMLElement) => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.opacity = '0';
        iframe.setAttribute('aria-hidden', 'true');
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) {
            document.body.removeChild(iframe);
            window.print();
            return;
        }

        const links: string[] = [];
        const inlineStyles: string[] = [];

        Array.from(document.styleSheets).forEach((sheet) => {
            const href = (sheet as CSSStyleSheet).href;
            if (href) {
                links.push(`<link rel="stylesheet" href="${href}" />`);
                return;
            }

            try {
                const rules = (sheet as CSSStyleSheet).cssRules;
                if (!rules) return;
                const cssText = Array.from(rules)
                    .map((r) => r.cssText)
                    .join('\n');
                if (cssText.trim()) inlineStyles.push(cssText);
            } catch {
                return;
            }
        });

        doc.open();
        doc.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${links.join('\n')}
    <style>
      @page { margin: 16mm; }
      html, body { background: #fff; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      ${inlineStyles.join('\n')}
      @media print {
        body * { visibility: visible !important; }
      }
    </style>
  </head>
  <body>
    <div>${printNode.outerHTML}</div>
  </body>
</html>`);
        doc.close();

        const w = iframe.contentWindow;
        if (!w) {
            document.body.removeChild(iframe);
            window.print();
            return;
        }

        const waitForRender = async () => {
            await new Promise<void>((resolve) => {
                w.requestAnimationFrame(() => {
                    w.requestAnimationFrame(() => resolve());
                });
            });

            const fonts = (doc as any).fonts;
            if (fonts?.ready) {
                try {
                    await fonts.ready;
                } catch {
                    // ignore
                }
            }
        };

        waitForRender()
            .then(() => {
                w.focus();
                w.print();
            })
            .catch(() => {
                w.focus();
                w.print();
            });

        window.setTimeout(() => {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 500);
    };

    const handlePrint = () => {
        if (onPrint) onPrint();
        const printNode = document.getElementById('invoice-receipt-print');
        if (printNode) {
            printInIframe(printNode);
            return;
        }
        window.print();
    };

    useEffect(() => {
        if (!autoPrint) return;

        const t = window.setTimeout(() => {
            handlePrint();
        }, 100);

        return () => {
            window.clearTimeout(t);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPrint]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            'partially-paid': 'bg-blue-100 text-blue-800',
            paid: 'bg-green-100 text-green-800',
            overdue: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent showClose={false} className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-full">
                <div className="print:p-8">
                    {/* Header - No Print */}
                    <div className="flex items-center justify-between mb-6 print:hidden">
                        <h2 className="text-2xl font-bold">Invoice Receipt</h2>
                        <div className="flex items-center gap-2">
                            <Button onClick={handlePrint} variant="default">
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                            <Button onClick={onClose} variant="ghost" size="icon">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Invoice Content */}
                    <div
                        id="invoice-receipt-print"
                        className="bg-white p-8 rounded-lg border print:border-0"
                    >
                        {/* Clinic Header */}
                        <div className="flex items-start justify-between mb-8 pb-6 border-b">
                            <div>
                                <h1 className="text-3xl font-bold text-primary mb-2">
                                    {receipt?.clinic?.name || 'DentalVerse Elite'}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {receipt?.clinic?.address || '123 Dental Street, City, State 12345'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Phone: {receipt?.clinic?.phone || '(555) 123-4567'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Email: {receipt?.clinic?.email || 'info@dentalverse.com'}
                                </p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-2xl font-bold text-primary mb-2">INVOICE</h2>
                                <p className="text-sm">
                                    <span className="font-semibold">Invoice #:</span> {receipt?.invoice?.invoiceNumber}
                                </p>
                                <p className="text-sm">
                                    <span className="font-semibold">Date:</span>{' '}
                                    {new Date(receipt?.invoice?.createdAt).toLocaleDateString()}
                                </p>
                                {receipt?.invoice?.dueDate && (
                                    <p className="text-sm">
                                        <span className="font-semibold">Due Date:</span>{' '}
                                        {new Date(receipt?.invoice?.dueDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Patient Information */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-3">Bill To:</h3>
                            <div className="bg-muted/30 p-4 rounded-lg">
                                <p className="font-semibold text-lg">
                                    {receipt?.patient?.firstName} {receipt?.patient?.lastName}
                                </p>
                                {receipt?.patient?.email && (
                                    <p className="text-sm text-muted-foreground">{receipt?.patient?.email}</p>
                                )}
                                {receipt?.patient?.phone && (
                                    <p className="text-sm text-muted-foreground">{receipt?.patient?.phone}</p>
                                )}
                            </div>
                        </div>

                        {/* Invoice Items */}
                        <div className="mb-8">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-primary">
                                        <th className="text-left py-3 font-semibold">Description</th>
                                        <th className="text-center py-3 font-semibold">Qty</th>
                                        <th className="text-right py-3 font-semibold">Unit Price</th>
                                        <th className="text-right py-3 font-semibold">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receipt?.items?.map((item: any, index: number) => (
                                        <tr key={index} className="border-b">
                                            <td className="py-3">{item.description}</td>
                                            <td className="text-center py-3">{item.quantity}</td>
                                            <td className="text-right py-3">{formatCurrency(item.unitPrice)}</td>
                                            <td className="text-right py-3 font-semibold">
                                                {formatCurrency(item.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Financial Summary */}
                        <div className="flex justify-end mb-8">
                            <div className="w-80">
                                <div className="space-y-2">
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Subtotal:</span>
                                        <span className="font-semibold">
                                            {formatCurrency(receipt?.financial?.subtotal || 0)}
                                        </span>
                                    </div>
                                    {receipt?.financial?.tax > 0 && (
                                        <div className="flex justify-between py-2">
                                            <span className="text-muted-foreground">Tax:</span>
                                            <span className="font-semibold">
                                                {formatCurrency(receipt?.financial?.tax)}
                                            </span>
                                        </div>
                                    )}
                                    {receipt?.financial?.discount > 0 && (
                                        <div className="flex justify-between py-2 text-green-600">
                                            <span>Discount:</span>
                                            <span className="font-semibold">
                                                -{formatCurrency(receipt?.financial?.discount)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between py-3 border-t-2 border-primary text-lg">
                                        <span className="font-bold">Total:</span>
                                        <span className="font-bold text-primary">
                                            {formatCurrency(receipt?.financial?.total || 0)}
                                        </span>
                                    </div>
                                    {receipt?.financial?.paidAmount > 0 && (
                                        <div className="flex justify-between py-2 text-green-600">
                                            <span className="font-semibold">Paid:</span>
                                            <span className="font-semibold">
                                                {formatCurrency(receipt?.financial?.paidAmount)}
                                            </span>
                                        </div>
                                    )}
                                    {receipt?.financial?.balance > 0 && (
                                        <div className="flex justify-between py-3 border-t text-lg">
                                            <span className="font-bold">Balance Due:</span>
                                            <span className="font-bold text-destructive">
                                                {formatCurrency(receipt?.financial?.balance)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center justify-between pt-6 border-t print:hidden">
                            <div>
                                <p className="text-sm text-muted-foreground">Payment Status:</p>
                                <Badge className={getStatusColor(receipt?.invoice?.status)}>
                                    {receipt?.invoice?.status?.toUpperCase()}
                                </Badge>
                            </div>
                        </div>

                        {/* Notes */}
                        {receipt?.invoice?.notes && (
                            <div className="mt-6 pt-6 border-t">
                                <h4 className="font-semibold mb-2">Notes:</h4>
                                <p className="text-sm text-muted-foreground">{receipt?.invoice?.notes}</p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
                            <p>Thank you for your business!</p>
                            <p className="mt-2">
                                For questions about this invoice, please contact us at{' '}
                                {receipt?.clinic?.email || 'info@dentalverse.com'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Print Styles */}
                <style>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .print\\:p-8, .print\\:p-8 * {
                            visibility: visible;
                        }
                        .print\\:p-8 {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                        .print\\:hidden {
                            display: none !important;
                        }
                        .print\\:border-0 {
                            border: 0 !important;
                        }
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}
