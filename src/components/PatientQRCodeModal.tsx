import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, QrCode } from 'lucide-react';

interface PatientQRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  birthDate: string;
  baseUrl: string;
}

export function PatientQRCodeModal({
  open,
  onOpenChange,
  patientName,
  birthDate,
  baseUrl,
}: PatientQRCodeModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Build the URL with query params
  const companionUrl = `${baseUrl}/acompanhante?nome=${encodeURIComponent(patientName)}&nascimento=${encodeURIComponent(birthDate)}`;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedDate = new Date(birthDate).toLocaleDateString('pt-BR');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${patientName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 20px;
            }
            .container {
              text-align: center;
              max-width: 300px;
              padding: 24px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
            }
            .qr-container {
              display: flex;
              justify-content: center;
              margin-bottom: 16px;
            }
            .patient-name {
              font-size: 18px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 4px;
            }
            .birth-date {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 16px;
            }
            .instructions {
              font-size: 12px;
              color: #374151;
              background: #f3f4f6;
              padding: 12px;
              border-radius: 8px;
              line-height: 1.5;
            }
            .logo {
              font-size: 14px;
              font-weight: 600;
              color: #0ea5e9;
              margin-top: 16px;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="qr-container">
              ${printContent.querySelector('svg')?.outerHTML || ''}
            </div>
            <p class="patient-name">${patientName}</p>
            <p class="birth-date">Nasc: ${formattedDate}</p>
            <div class="instructions">
              <strong>Instruções:</strong><br/>
              1. Aponte a câmera do celular para o QR Code<br/>
              2. Acesse o link que aparecer<br/>
              3. Acompanhe o status em tempo real
            </div>
            <p class="logo">♥ Zelo</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const formattedDate = new Date(birthDate).toLocaleDateString('pt-BR');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            QR Code de Acesso
          </DialogTitle>
          <DialogDescription>
            Escaneie o código para acompanhar o status do paciente em tempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* QR Code */}
          <div 
            ref={printRef} 
            className="bg-white p-4 rounded-xl border border-border shadow-soft"
          >
            <QRCodeSVG 
              value={companionUrl} 
              size={200} 
              level="M"
              includeMargin={false}
            />
          </div>

          {/* Patient Info */}
          <div className="text-center">
            <p className="font-semibold text-foreground">{patientName}</p>
            <p className="text-sm text-muted-foreground">Nascimento: {formattedDate}</p>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg w-full">
            <p className="font-medium mb-1">Instruções para o acompanhante:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Aponte a câmera do celular para o QR Code</li>
              <li>Acesse o link que aparecer</li>
              <li>Acompanhe o status em tempo real</li>
            </ol>
          </div>

          {/* Print Button */}
          <Button onClick={handlePrint} className="w-full shadow-soft">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Etiqueta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
