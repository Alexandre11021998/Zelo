import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { Upload, Loader2, FileSpreadsheet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface PatientCsvImportProps {
  onImportComplete: () => void;
}

interface ParsedPatient {
  name: string;
  data_nascimento: string;
}

export function PatientCsvImport({ onImportComplete }: PatientCsvImportProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ParsedPatient[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { profile } = useProfile();

  const parseCSV = (text: string): ParsedPatient[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    // Remove header line
    const dataLines = lines.slice(1);
    const patients: ParsedPatient[] = [];

    for (const line of dataLines) {
      // Handle both comma and semicolon separators
      const separator = line.includes(';') ? ';' : ',';
      const columns = line.split(separator).map(col => col.trim().replace(/^["']|["']$/g, ''));

      if (columns.length >= 2) {
        const name = columns[0];
        let dataNascimento = columns[1];

        // Convert DD/MM/YYYY to YYYY-MM-DD if needed
        if (dataNascimento.includes('/')) {
          const parts = dataNascimento.split('/');
          if (parts.length === 3) {
            dataNascimento = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }

        if (name && dataNascimento && /^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
          patients.push({ name, data_nascimento: dataNascimento });
        }
      }
    }

    return patients;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed);

      if (parsed.length === 0) {
        toast({
          title: 'Arquivo inválido',
          description: 'Nenhum paciente válido encontrado. Verifique o formato do arquivo.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    if (!profile?.hospital_id) {
      toast({
        title: 'Hospital não configurado',
        description: 'Seu perfil não está vinculado a nenhum hospital. Contate o administrador.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const patientsWithHospital = preview.map(p => ({
      ...p,
      hospital_id: profile.hospital_id,
    }));

    const { error } = await supabase
      .from('patients')
      .insert(patientsWithHospital);

    if (error) {
      console.error('Erro ao importar pacientes:', error);
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Importação concluída',
        description: `${preview.length} paciente(s) importado(s) com sucesso.`,
      });
      setPreview([]);
      setOpen(false);
      onImportComplete();
    }

    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setOpen(false);
    setPreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Pacientes via CSV</DialogTitle>
          <DialogDescription>
            O arquivo deve ter colunas: <strong>Nome</strong> e <strong>Data de Nascimento</strong> (DD/MM/AAAA ou AAAA-MM-DD).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer text-primary hover:underline"
            >
              Clique para selecionar um arquivo CSV
            </label>
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Pré-visualização ({preview.length} paciente{preview.length > 1 ? 's' : ''}):
              </p>
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">Data Nasc.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((p, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{p.name}</td>
                        <td className="p-2">{new Date(p.data_nascimento).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                    {preview.length > 10 && (
                      <tr className="border-t">
                        <td colSpan={2} className="p-2 text-center text-muted-foreground">
                          ... e mais {preview.length - 10} paciente(s)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={loading || preview.length === 0}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Importar {preview.length > 0 ? `(${preview.length})` : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
