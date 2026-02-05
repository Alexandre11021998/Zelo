import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Users, LogOut, Loader2, ArrowLeft, UserPlus, Copy, Check, Trash2, KeyRound } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

const JOB_ROLES = [
  { value: 'enfermeiro', label: 'Enfermeiro(a)' },
  { value: 'tecnico_enfermagem', label: 'Técnico(a) de Enfermagem' },
  { value: 'recepcionista', label: 'Recepcionista' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'outros', label: 'Outros' },
] as const;

interface StaffMember {
  id: string;
  full_name: string | null;
  job_role: string | null;
  created_at: string;
  user_roles: { role: string }[];
}

interface Hospital {
  id: string;
  name: string;
  codigo_acesso: string;
}

export default function TeamManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { signOut, user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const fetchHospital = async () => {
    if (!profile?.hospital_id) return;

    const { data, error } = await supabase
      .from('hospitals')
      .select('id, name, codigo_acesso')
      .eq('id', profile.hospital_id)
      .single();

    if (error) {
      console.error('Erro ao carregar hospital:', error);
    } else {
      setHospital(data);
    }
  };

  const fetchStaff = async () => {
    if (!profile?.hospital_id) {
      setLoading(false);
      return;
    }

    // Get profiles with their roles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, job_role, created_at')
      .eq('hospital_id', profile.hospital_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar equipe:', error);
      toast({
        title: 'Erro ao carregar equipe',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Get roles for each profile
    const staffWithRoles: StaffMember[] = [];
    for (const p of profiles || []) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', p.id);
      
      staffWithRoles.push({
        ...p,
        user_roles: roles || [],
      });
    }

    setStaff(staffWithRoles);
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.hospital_id) {
      fetchHospital();
      fetchStaff();
    }
  }, [profile?.hospital_id]);

  const handleCopyCode = async () => {
    if (!hospital?.codigo_acesso) return;
    
    try {
      await navigator.clipboard.writeText(hospital.codigo_acesso);
      setCopied(true);
      toast({
        title: 'Código copiado!',
        description: 'Compartilhe com sua equipe.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Erro ao copiar',
        description: 'Copie o código manualmente.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha Nome, E-mail e Senha.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await supabase.functions.invoke('create-staff', {
        body: {
          email: email.trim(),
          password: password,
          full_name: fullName.trim(),
          job_role: jobRole || null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao criar funcionário');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Funcionário criado!',
        description: `${fullName} foi adicionado à equipe.`,
      });
      
      setFullName('');
      setEmail('');
      setPassword('');
      setJobRole('');
      setIsDialogOpen(false);
      fetchStaff();
    } catch (error: any) {
      console.error('Erro ao criar funcionário:', error);
      toast({
        title: 'Erro ao criar funcionário',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  const handleRemoveStaff = async (userId: string, name: string) => {
    setRemovingId(userId);

    try {
      const response = await supabase.functions.invoke('remove-staff', {
        body: { user_id: userId },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao remover funcionário');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Funcionário removido',
        description: `${name || 'O funcionário'} foi removido da equipe.`,
      });
      
      fetchStaff();
    } catch (error: any) {
      console.error('Erro ao remover funcionário:', error);
      toast({
        title: 'Erro ao remover',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    }

    setRemovingId(null);
  };

  const getJobRoleLabel = (value: string | null) => {
    if (!value) return 'Não definido';
    const role = JOB_ROLES.find(r => r.value === value);
    return role?.label || value;
  };

  const isAdmin = (member: StaffMember) => {
    return member.user_roles.some(r => r.role === 'admin' || r.role === 'superadmin');
  };

  if (!profile?.hospital_id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Hospital não configurado</h3>
            <p className="text-muted-foreground mb-4">
              Seu perfil não está vinculado a nenhum hospital. Contate o administrador.
            </p>
            <Link to="/gestao-hospitalar">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-primary shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">Zelo</h1>
              <p className="text-sm text-primary-foreground/80">Gestão de Equipe</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/gestao-hospitalar">
              <Button variant="secondary" size="sm" className="shadow-soft">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={signOut} className="shadow-soft">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Access Code Card */}
        {hospital && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <KeyRound className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Código de Acesso do Hospital</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Compartilhe este código para que sua equipe se cadastre em{' '}
                      <span className="font-medium">/cadastro-equipe</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-background border-2 border-primary/30 rounded-xl px-6 py-3">
                    <span className="font-mono text-2xl font-bold tracking-widest text-primary">
                      {hospital.codigo_acesso}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCode}
                    className="h-12 w-12 shrink-0"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Equipe do Hospital</h2>
            {hospital && (
              <p className="text-muted-foreground">{hospital.name}</p>
            )}
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-soft">
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Membro
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border shadow-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">Adicionar Membro à Equipe</DialogTitle>
                <DialogDescription>
                  Crie uma conta para um novo funcionário. Ele receberá acesso como colaborador.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <Input
                      id="fullName"
                      placeholder="Ex: Maria Silva"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobRole">Cargo</Label>
                    <Select value={jobRole} onValueChange={setJobRole} disabled={isSubmitting}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {JOB_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="shadow-soft">
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    Criar Funcionário
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Staff Table */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <Card className="bg-card border-border shadow-card">
            <CardContent className="py-12 text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Nenhum funcionário</h3>
              <p className="text-muted-foreground">
                Adicione membros à equipe ou compartilhe o código de acesso.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground">Membros da Equipe</CardTitle>
              <CardDescription>{staff.length} pessoa(s) cadastrada(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.full_name || 'Sem nome'}
                        {member.id === user?.id && (
                          <Badge variant="secondary" className="ml-2">Você</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getJobRoleLabel(member.job_role)}</TableCell>
                      <TableCell>
                        {isAdmin(member) ? (
                          <Badge variant="default">Gestor</Badge>
                        ) : (
                          <Badge variant="outline">Colaborador</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(member.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.id !== user?.id && !isAdmin(member) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={removingId === member.id}
                              >
                                {removingId === member.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover funcionário?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover <strong>{member.full_name}</strong> da equipe?
                                  Esta ação não pode ser desfeita e o funcionário perderá acesso ao sistema.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveStaff(member.id, member.full_name || '')}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}