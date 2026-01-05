import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PatientStepper } from '@/components/PatientStepper';
import { PatientStatus } from '@/lib/constants';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

interface Patient {
  id: string;
  name: string;
  data_nascimento: string;
  status: PatientStatus;
}

const companionSearchSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Preencha o nome do paciente.')
    .max(200, 'O nome do paciente está muito longo.'),
  dataNascimento: z
    .string()
    .trim()
    .min(1, 'Preencha a data de nascimento.')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Use o formato AAAA-MM-DD.'),
});

const normalizeName = (raw: string) =>
  raw
    .replace(/[%_]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

// ILIKE é case-insensitive, mas é pattern matching; usar % entre as palavras ajuda
// a não falhar por diferenças pequenas de espaçamento no banco.
const nameToIlikePattern = (normalizedName: string) => normalizedName.split(' ').join('%');

export default function CompanionLogin() {
  const [name, setName] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = companionSearchSchema.safeParse({ name, dataNascimento });

    if (!parsed.success) {
      toast({
        title: 'Campos obrigatórios',
        description: parsed.error.issues[0]?.message ?? 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    const normalizedName = normalizeName(parsed.data.name);
    const dob = parsed.data.dataNascimento;

    setLoading(true);

    // Case-insensitive search using ILIKE, only active patients
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .ilike('name', nameToIlikePattern(normalizedName))
      .eq('data_nascimento', dob)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      toast({
        title: 'Erro ao buscar',
        description: error.message,
        variant: 'destructive',
      });
    } else if (!data) {
      toast({
        title: 'Paciente não encontrado',
        description: 'Verifique se o nome e a data de nascimento estão corretos.',
        variant: 'destructive',
      });
      setPatient(null);
    } else if (data && data.id && data.name && data.status) {
      setPatient(data as Patient);
    } else {
      toast({
        title: 'Erro nos dados',
        description: 'Os dados do paciente estão incompletos. Tente novamente.',
        variant: 'destructive',
      });
      setPatient(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!patient) return;

    const channel = supabase
      .channel('patient-status')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'patients',
          filter: `id=eq.${patient.id}`
        },
        (payload) => {
          setPatient(payload.new as Patient);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patient?.id]);

  if (patient && patient.status && patient.name) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col">
        <header className="py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Acompanhamento Hospitalar</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardContent className="pt-6">
              <PatientStepper currentStatus={patient.status} patientName={patient.name} />
              <div className="text-center mt-6">
                <Button variant="outline" onClick={() => setPatient(null)}>
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Acompanhamento de Paciente</CardTitle>
          <CardDescription>
            Insira os dados do paciente para acompanhar o status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Insira o nome exatamente como consta na ficha de internamento.
            </AlertDescription>
          </Alert>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo do Paciente</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Input
                id="dataNascimento"
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar Paciente'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
