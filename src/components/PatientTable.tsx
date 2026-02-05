import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PATIENT_STATUS, STATUS_ORDER, PatientStatus } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { ChevronDown, Loader2, LogOut, QrCode, RotateCcw } from 'lucide-react';
import { PatientQRCodeModal } from './PatientQRCodeModal';

interface Patient {
  id: string;
  name: string;
  data_nascimento: string;
  status: PatientStatus;
  is_active?: boolean;
  updated_by_name?: string | null;
}

interface PatientTableProps {
  patients: Patient[];
  onStatusChange: (patientId: string, newStatus: PatientStatus) => void;
  onDischarge?: (patientId: string) => void;
  onReactivate?: (patientId: string) => void;
  updatingId: string | null;
  showDischarge?: boolean;
  showReactivate?: boolean;
}

// Get base URL for QR codes (production URL or current origin)
const getBaseUrl = () => {
  // Use the published URL if available, otherwise use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

const STATUS_COLORS: Record<PatientStatus, string> = {
  aguardando: 'bg-slate-500/20 text-slate-700 border-slate-500/30',
  em_preparacao: 'bg-amber-500/20 text-amber-700 border-amber-500/30',
  em_procedimento: 'bg-red-500/20 text-red-700 border-red-500/30',
  recuperacao_pos_anestesica: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  no_quarto: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
  em_alta: 'bg-green-600/20 text-green-700 border-green-600/30',
};

export function PatientTable({ 
  patients, 
  onStatusChange, 
  onDischarge, 
  onReactivate,
  updatingId,
  showDischarge,
  showReactivate,
}: PatientTableProps) {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const baseUrl = getBaseUrl();

  const handleOpenQrModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setQrModalOpen(true);
  };

  return (
    <>
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Data de Nascimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{patient.name}</p>
                  {patient.updated_by_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Alterado por: {patient.updated_by_name}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {new Date(patient.data_nascimento).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={cn('border', STATUS_COLORS[patient.status])}
                >
                  {PATIENT_STATUS[patient.status]?.label || patient.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {/* QR Code Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenQrModal(patient)}
                    title="Gerar QR Code"
                    className="text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    <QrCode className="w-5 h-5" />
                  </Button>

                  {/* Status Change Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={updatingId === patient.id}
                      >
                        {updatingId === patient.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Alterar Status
                            <ChevronDown className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {STATUS_ORDER.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => onStatusChange(patient.id, status)}
                          disabled={patient.status === status}
                          className={cn(
                            patient.status === status && 'bg-accent font-semibold'
                          )}
                        >
                          {PATIENT_STATUS[status].label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Discharge Button */}
                  {showDischarge && onDischarge && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={updatingId === patient.id}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <LogOut className="w-4 h-4 mr-1" />
                          Alta
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Alta</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja confirmar a alta do paciente <strong>{patient.name}</strong>?
                            <br />
                            O paciente será movido para o histórico.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDischarge(patient.id)}>
                            Confirmar Alta
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {/* Reactivate Button */}
                  {showReactivate && onReactivate && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={updatingId === patient.id}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Reativar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reativar Paciente</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja reativar o paciente <strong>{patient.name}</strong>?
                            <br />
                            O paciente voltará para a lista de internados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onReactivate(patient.id)}>
                            Reativar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    {/* QR Code Modal */}
    {selectedPatient && (
      <PatientQRCodeModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        patientName={selectedPatient.name}
        birthDate={selectedPatient.data_nascimento}
        baseUrl={baseUrl}
      />
    )}
    </>
  );
}
