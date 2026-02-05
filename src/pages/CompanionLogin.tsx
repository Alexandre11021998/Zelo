import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartHandshake, AlertCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PatientStepper } from '@/components/PatientStepper';
import { PatientStatus } from '@/lib/constants';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { DateInput } from '@/components/DateInput';

interface Patient {
  id: string;
  name: string;
  data_nascimento: string;
  status: PatientStatus;
  hospital_id: string | null;
}

const companionSearchSchema = z.object({
  patientName: z
    .string()
    .trim()
    .min(3, 'O nome deve ter pelo menos 3 caracteres.')
    .max(100, 'Nome muito longo.'),
  birthDate: z
    .string()
    .min(1, 'Preencha a data de nascimento.'),
});

export default function CompanionLogin() {
  const [searchParams] = useSearchParams();
  const [patientName, setPatientName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [showNotFoundAlert, setShowNotFoundAlert] = useState(false);
  const { toast } = useToast();
  const autoSearchDone = useRef(false);

  // Function to perform the actual search
  const performSearch = async (name: string, date: string) => {
    setLoading(true);
    setShowNotFoundAlert(false);

    const { data, error } = await supabase
      .from('patients')
      .select('id, name, data_nascimento, status, hospital_id')
      .ilike('name', name)
      .eq('data_nascimento', date)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      toast({
        title: 'Erro ao buscar',
        description: error.message,
        variant: 'destructive',
      });
      setPatient(null);
    } else if (!data) {
      setShowNotFoundAlert(true);
      setPatientName('');
      setBirthDate('');
      setPatient(null);
    } else if (data && data.id && data.name && data.status) {
      setPatient(data as Patient);
      setShowNotFoundAlert(false);
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

  // Auto-search when query params are present
  useEffect(() => {
    if (autoSearchDone.current) return;
    
    const nameParam = searchParams.get('nome');
    const birthParam = searchParams.get('nascimento');

    if (nameParam && birthParam) {
      autoSearchDone.current = true;
      setPatientName(nameParam);
      setBirthDate(birthParam);
      performSearch(nameParam, birthParam);
    }
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = companionSearchSchema.safeParse({ patientName, birthDate });

    if (!parsed.success) {
      toast({
        title: 'Campos obrigatórios',
        description: parsed.error.issues[0]?.message ?? 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    await performSearch(parsed.data.patientName.trim(), parsed.data.birthDate);
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
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <HeartHandshake className="w-5 h-5 text-primary" />
            <span className="font-semibold">Zelo</span>
          </Link>
        </header>
        
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-companion border border-companion/50 shadow-card">
            <CardContent className="pt-6">
              <PatientStepper currentStatus={patient.status} patientName={patient.name} />
              <div className="text-center mt-6">
                <Button variant="outline" onClick={() => setPatient(null)} className="bg-white/80">
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <HeartHandshake className="w-5 h-5 text-primary" />
          <span className="font-semibold">Zelo</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-companion border border-companion/50 shadow-card">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center mb-4 shadow-soft">
              <HeartHandshake className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-foreground">Acompanhamento de Paciente</CardTitle>
            <CardDescription className="text-companion-foreground">
              Insira os dados do paciente para acompanhar o status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showNotFoundAlert && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Dados não conferem</AlertTitle>
                <AlertDescription>
                  Verifique o nome e a data de nascimento digitados e tente novamente.
                </AlertDescription>
              </Alert>
            )}
            <Alert className="mb-4 bg-white/60 border-white/80">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Utilize o nome completo e a data de nascimento do paciente conforme informado no momento da internação.
              </AlertDescription>
            </Alert>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Nome Completo do Paciente</Label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Digite o nome completo"
                  className="bg-white/80 border-white"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <DateInput
                  id="birthDate"
                  value={birthDate}
                  onChange={setBirthDate}
                  className="bg-white/80 border-white"
                />
              </div>
              <Button type="submit" className="w-full shadow-soft" disabled={loading}>
                {loading ? 'Buscando...' : 'Buscar Paciente'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
