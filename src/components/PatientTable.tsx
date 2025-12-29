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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PATIENT_STATUS, STATUS_ORDER, PatientStatus } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { ChevronDown, Loader2 } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  data_nascimento: string;
  status: PatientStatus;
}

interface PatientTableProps {
  patients: Patient[];
  onStatusChange: (patientId: string, newStatus: PatientStatus) => void;
  updatingId: string | null;
}

const STATUS_COLORS: Record<PatientStatus, string> = {
  aguardando: 'bg-slate-500/20 text-slate-700 border-slate-500/30',
  em_preparacao: 'bg-amber-500/20 text-amber-700 border-amber-500/30',
  em_cirurgia: 'bg-red-500/20 text-red-700 border-red-500/30',
  recuperacao_pos_anestesica: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  no_quarto: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
};

export function PatientTable({ patients, onStatusChange, updatingId }: PatientTableProps) {
  return (
    <div className="rounded-lg border bg-card">
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
              <TableCell className="font-medium">{patient.name}</TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
