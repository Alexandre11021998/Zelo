import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PatientForm } from '@/components/PatientForm';
import { PatientTable } from '@/components/PatientTable';
import { Button } from '@/components/ui/button';
import { LogOut, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PatientStatus } from '@/lib/constants';

interface Patient {
  id: string;
  name: string;
  data_nascimento: string;
  status: PatientStatus;
}

export default function AdminDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { signOut } = useAuth();
  const { toast } = useToast();

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar pacientes:', error);
      toast({
        title: 'Erro ao carregar pacientes',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setPatients(data as Patient[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();

    const channel = supabase
      .channel('patients-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        () => fetchPatients()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusChange = async (patientId: string, newStatus: PatientStatus) => {
    setUpdatingId(patientId);
    
    const { error } = await supabase
      .from('patients')
      .update({ status: newStatus })
      .eq('id', patientId);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Status atualizado',
        description: 'O status do paciente foi atualizado com sucesso.',
      });
    }
    setUpdatingId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Painel de Gestão Hospitalar</h1>
              <p className="text-sm text-muted-foreground">Gerenciamento de Pacientes</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <PatientForm onPatientAdded={fetchPatients} />

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-card">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhum paciente cadastrado</h2>
            <p className="text-muted-foreground">
              Use o formulário acima para cadastrar seu primeiro paciente.
            </p>
          </div>
        ) : (
          <PatientTable
            patients={patients}
            onStatusChange={handleStatusChange}
            updatingId={updatingId}
          />
        )}
      </main>
    </div>
  );
}
