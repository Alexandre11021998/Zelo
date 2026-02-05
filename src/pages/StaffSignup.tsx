import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Loader2, HeartHandshake, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { applyCpfMask, validateCpf, removeCpfMask } from '@/lib/cpfMask';
import { z } from 'zod';

const JOB_ROLES = [
  { value: 'enfermeiro', label: 'Enfermeiro(a)' },
  { value: 'tecnico_enfermagem', label: 'Técnico(a) de Enfermagem' },
  { value: 'recepcionista', label: 'Recepcionista' },
  { value: 'outros', label: 'Outros' },
] as const;

const signupSchema = z.object({
  hospitalCode: z.string().length(6, 'Código do hospital deve ter 6 caracteres'),
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme sua senha'),
  fullName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  cpf: z.string().refine((val) => validateCpf(val), 'CPF inválido'),
  registrationNumber: z.string().max(20).optional(),
  jobRole: z.string().min(1, 'Selecione um cargo'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export default function StaffSignup() {
  const [hospitalCode, setHospitalCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user, isColaborador, isAdmin, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && (isColaborador || isAdmin)) {
    return <Navigate to="/gestao-hospitalar" replace />;
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyCpfMask(e.target.value);
    setCpf(masked);
  };

  const handleHospitalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setHospitalCode(value);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse({
      hospitalCode,
      email,
      password,
      confirmPassword,
      fullName,
      cpf,
      registrationNumber: registrationNumber || undefined,
      jobRole,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    // Verify hospital code exists
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .select('id, name')
      .eq('codigo_acesso', hospitalCode.toUpperCase())
      .maybeSingle();

    if (hospitalError || !hospital) {
      setErrors({ hospitalCode: 'Código de Hospital inválido. Solicite o código ao seu gestor.' });
      setLoading(false);
      return;
    }

    // Check if CPF already exists
    const cleanCpf = removeCpfMask(cpf);
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('cpf', cleanCpf)
      .maybeSingle();

    if (existingProfile) {
      setErrors({ cpf: 'Este CPF já está registrado no sistema' });
      setLoading(false);
      return;
    }

    // Sign up user with metadata
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName.trim(),
          cpf: cleanCpf,
          registration_number: registrationNumber?.trim().toUpperCase() || null,
          job_role: jobRole,
          hospital_id: hospital.id,
        },
      },
    });

    if (signUpError) {
      toast({
        title: 'Erro ao cadastrar',
        description: signUpError.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (!signUpData.user) {
      toast({
        title: 'Erro ao cadastrar',
        description: 'Não foi possível criar o usuário. Tente novamente.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Update profile with hospital_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        hospital_id: hospital.id,
        full_name: fullName.trim(),
        cpf: cleanCpf,
        registration_number: registrationNumber?.trim().toUpperCase() || null,
        job_role: jobRole,
      })
      .eq('id', signUpData.user.id);

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError);
      // Try to sign out and show error
      await supabase.auth.signOut();
      toast({
        title: 'Erro ao configurar perfil',
        description: 'Houve um erro ao vincular seu perfil ao hospital. Tente novamente.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Add colaborador role - CRITICAL
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: signUpData.user.id,
        role: 'colaborador',
      });

    if (roleError) {
      console.error('Erro ao adicionar role:', roleError);
      // Sign out and show error - user is in "ghost" state without role
      await supabase.auth.signOut();
      toast({
        title: 'Erro ao configurar permissões',
        description: 'Houve um erro ao definir suas permissões. Entre em contato com o gestor do hospital.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({
      title: 'Conta criada com sucesso!',
      description: `Você foi vinculado ao hospital ${hospital.name}.`,
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="container mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <HeartHandshake className="w-5 h-5 text-primary" />
          <span className="font-semibold">Zelo</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border border-border shadow-card">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4 shadow-soft">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-foreground">Cadastro de Colaborador</CardTitle>
            <CardDescription>
              Preencha seus dados e o código fornecido pelo gestor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Hospital Code - Highlighted */}
              <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Label htmlFor="hospitalCode" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Código do Hospital *
                </Label>
                <Input
                  id="hospitalCode"
                  type="text"
                  value={hospitalCode}
                  onChange={handleHospitalCodeChange}
                  placeholder="Ex: ABC123"
                  maxLength={6}
                  disabled={loading}
                  className="bg-background font-mono text-lg tracking-widest text-center uppercase"
                />
                {errors.hospitalCode && (
                  <p className="text-sm text-destructive">{errors.hospitalCode}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Solicite o código ao gestor do seu hospital
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  disabled={loading}
                  className="bg-background"
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  type="text"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  disabled={loading}
                  className="bg-background"
                />
                {errors.cpf && (
                  <p className="text-sm text-destructive">{errors.cpf}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationNumber">COREN (opcional)</Label>
                <Input
                  id="registrationNumber"
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="Ex: COREN-SP 123456"
                  disabled={loading}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobRole">Cargo/Função *</Label>
                <Select value={jobRole} onValueChange={setJobRole} disabled={loading}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione seu cargo" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {JOB_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.jobRole && (
                  <p className="text-sm text-destructive">{errors.jobRole}</p>
                )}
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <p className="text-sm text-muted-foreground mb-4">Dados de acesso</p>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    disabled={loading}
                    className="bg-background"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="signup-password">Senha *</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    disabled={loading}
                    className="bg-background"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="signup-confirm-password">Confirmar Senha *</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    disabled={loading}
                    className="bg-background"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full shadow-soft" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  'Cadastrar'
                )}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Já tem uma conta?{' '}
              <Link to="/login-hospital" className="text-primary font-medium hover:underline">
                Fazer login
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
