import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PatientSearchBar } from '@/components/PatientSearchBar';
import { PatientCsvImport } from '@/components/PatientCsvImport';
import { PatientTable } from '@/components/PatientTable';
import { DateInput } from '@/components/DateInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, HeartHandshake, UserSearch, History, UserPlus, Loader2, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { PatientStatus } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Patient {
  id: string;
  name: string;
  data_nascimento: string;
  status: PatientStatus;
  is_active: boolean;
  updated_by_name?: string | null;
  cpf?: string | null;
  codigo_paciente?: string | null;
}

// Remove dots, dashes, and spaces from CPF
const cleanCpf = (cpf: string): string => {
  return cpf.replace(/[\.\-\s]/g, '').trim();
};

export default function AdminDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientDob, setNewPatientDob] = useState('');
  const [newPatientCpf, setNewPatientCpf] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signOut, user, isSuperAdmin, isAdmin } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  // Check if user is a manager (admin or superadmin have management privileges)
  const isManager = isAdmin || isSuperAdmin;

  const getUpdatedByInfo = () => ({
    updated_by: user?.id || null,
    updated_by_name: profile?.full_name || user?.email || 'Desconhecido',
  });

  const handleNewPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPatientName.trim() || !newPatientDob || !newPatientCpf.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome, CPF e a data de nascimento.',
        variant: 'destructive',
      });
      return;
    }

    if (!profile?.hospital_id) {
      toast({
        title: 'Hospital não configurado',
        description: 'Seu perfil não está vinculado a nenhum hospital. Contate o administrador.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('patients')
      .insert({
        name: newPatientName.trim(),
        data_nascimento: newPatientDob,
        cpf: cleanCpf(newPatientCpf),
        hospital_id: profile.hospital_id,
        ...getUpdatedByInfo(),
      })
      .select('codigo_paciente')
      .single();

    if (error) {
      console.error('Erro ao cadastrar paciente:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Paciente cadastrado',
        description: `${newPatientName} cadastrado. Código: ${data?.codigo_paciente || 'gerado'}`,
      });
      setNewPatientName('');
      setNewPatientDob('');
      setNewPatientCpf('');
      setIsNewPatientOpen(false);
      fetchPatients();
    }

    setIsSubmitting(false);
  };

  const fetchPatients = async () => {
    // Superadmins can see all patients; regular admins need hospital_id
    if (!isSuperAdmin && !profile?.hospital_id) {
      setLoading(false);
      return;
    }

    let query = supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    // Only filter by hospital_id if NOT superadmin
    if (!isSuperAdmin && profile?.hospital_id) {
      query = query.eq('hospital_id', profile.hospital_id);
    }

    const { data, error } = await query;

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
    // Superadmins can fetch immediately; admins need hospital_id
    if (isSuperAdmin || profile?.hospital_id) {
      fetchPatients();
    } else if (profile !== undefined) {
      // Profile loaded but no hospital_id and not superadmin
      setLoading(false);
    }

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
  }, [isSuperAdmin, profile?.hospital_id]);

  const handleStatusChange = async (patientId: string, newStatus: PatientStatus) => {
    setUpdatingId(patientId);
    
    const { error } = await supabase
      .from('patients')
      .update({
        status: newStatus,
        ...getUpdatedByInfo(),
      })
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

  const handleDischarge = async (patientId: string) => {
    setUpdatingId(patientId);
    
    const { error } = await supabase
      .from('patients')
      .update({
        is_active: false,
        ...getUpdatedByInfo(),
      })
      .eq('id', patientId);

    if (error) {
      console.error('Erro ao dar alta:', error);
      toast({
        title: 'Erro ao dar alta',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Alta registrada',
        description: 'O paciente recebeu alta com sucesso.',
      });
    }
    setUpdatingId(null);
  };

  const handleReactivate = async (patientId: string) => {
    setUpdatingId(patientId);
    
    const { error } = await supabase
      .from('patients')
      .update({
        is_active: true,
        ...getUpdatedByInfo(),
      })
      .eq('id', patientId);

    if (error) {
      console.error('Erro ao reativar:', error);
      toast({
        title: 'Erro ao reativar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Paciente reativado',
        description: 'O paciente foi reativado com sucesso.',
      });
    }
    setUpdatingId(null);
  };

  // Filter patients based on search query and active status
  const filteredPatients = useMemo(() => {
    const isActive = activeTab === 'active';
    let filtered = patients.filter((p) => p.is_active === isActive);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((patient) =>
        patient.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [patients, searchQuery, activeTab]);

  const activeCount = patients.filter((p) => p.is_active).length;
  const historyCount = patients.filter((p) => !p.is_active).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with primary color */}
      <header className="border-b border-border bg-primary shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">Zelo</h1>
              <p className="text-sm text-primary-foreground/80">
                {profile?.full_name || 'Painel de Enfermagem'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isManager && (
              <Link to="/equipe">
                <Button variant="secondary" size="sm" className="shadow-soft">
                  <Users className="w-4 h-4 mr-2" />
                  Equipe
                </Button>
              </Link>
            )}
            <Button variant="secondary" onClick={signOut} className="shadow-soft">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Action buttons and Search */}
        <div className="mb-6 space-y-4">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Dialog open={isNewPatientOpen} onOpenChange={setIsNewPatientOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-soft">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Paciente
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border shadow-card">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Cadastrar Novo Paciente</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do paciente para realizar o cadastro.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleNewPatientSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="patientName">Nome Completo</Label>
                      <Input
                        id="patientName"
                        placeholder="Digite o nome do paciente"
                        value={newPatientName}
                        onChange={(e) => setNewPatientName(e.target.value)}
                        disabled={isSubmitting}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patientCpf">CPF</Label>
                      <Input
                        id="patientCpf"
                        placeholder="000.000.000-00"
                        value={newPatientCpf}
                        onChange={(e) => setNewPatientCpf(e.target.value)}
                        disabled={isSubmitting}
                        className="bg-background"
                        maxLength={14}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patientDob">Data de Nascimento</Label>
                      <DateInput
                        id="patientDob"
                        value={newPatientDob}
                        onChange={setNewPatientDob}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsNewPatientOpen(false)} disabled={isSubmitting}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="shadow-soft">
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      Cadastrar
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <PatientCsvImport onImportComplete={fetchPatients} />
          </div>

          {/* Search Bar - Highlighted with primary accent */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-card">
            <PatientSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar paciente por nome..."
            />
          </div>
        </div>

        {/* Tabs for Active / History */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'history')} className="mb-6">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="active" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <HeartHandshake className="w-4 h-4" />
              Internados ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="w-4 h-4" />
              Histórico ({historyCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-12 border border-border rounded-xl bg-card shadow-card">
                <UserSearch className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-foreground">
                  {searchQuery ? 'Nenhum paciente encontrado' : 'Nenhum paciente internado'}
                </h2>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'Tente buscar com outro termo ou importe pacientes via CSV.'
                    : 'Importe uma lista de pacientes via CSV para começar.'}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''} internado{filteredPatients.length !== 1 ? 's' : ''}
                </p>
                <PatientTable
                  patients={filteredPatients}
                  onStatusChange={handleStatusChange}
                  onDischarge={handleDischarge}
                  updatingId={updatingId}
                  showDischarge
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-12 border border-border rounded-xl bg-card shadow-card">
                <History className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-foreground">
                  {searchQuery ? 'Nenhum paciente encontrado' : 'Histórico vazio'}
                </h2>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'Tente buscar com outro termo.'
                    : 'Pacientes que receberam alta aparecerão aqui.'}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''} no histórico
                </p>
                <PatientTable
                  patients={filteredPatients}
                  onStatusChange={handleStatusChange}
                  onReactivate={handleReactivate}
                  updatingId={updatingId}
                  showReactivate
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
