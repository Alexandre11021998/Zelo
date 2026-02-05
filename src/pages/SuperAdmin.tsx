import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Plus, LogOut, Loader2, MapPin, User, AlertCircle, Pencil } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Hospital {
  id: string;
  name: string;
  cnpj: string;
  codigo_acesso: string;
  razao_social: string | null;
  email_contato: string | null;
  telefone: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  nome_gestor: string | null;
  dados_faturamento: string | null;
  logo_url: string | null;
  created_at: string;
}

interface HospitalFormData {
  name: string;
  cnpj: string;
  razao_social: string;
  email_contato: string;
  telefone: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  nome_gestor: string;
  email_gestor: string;
  senha_gestor: string;
  dados_faturamento: string;
}

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const initialFormData: HospitalFormData = {
  name: '',
  cnpj: '',
  razao_social: '',
  email_contato: '',
  telefone: '',
  cep: '',
  endereco: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: '',
  nome_gestor: '',
  email_gestor: '',
  senha_gestor: '',
  dados_faturamento: '',
};

export default function SuperAdmin() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [formData, setFormData] = useState<HospitalFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signOut } = useAuth();
  const { toast } = useToast();

  const fetchHospitals = async () => {
    const { data, error } = await supabase
      .from('hospitals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar hospitais:', error);
      toast({
        title: 'Erro ao carregar hospitais',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setHospitals(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const formatTelefone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return digits.replace(/^(\d{5})(\d)/, '$1-$2');
  };

  const handleInputChange = (field: keyof HospitalFormData, value: string) => {
    let formattedValue = value;
    
    if (field === 'cnpj') {
      formattedValue = formatCnpj(value);
    } else if (field === 'telefone') {
      formattedValue = formatTelefone(value);
    } else if (field === 'cep') {
      formattedValue = formatCep(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.cnpj.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha pelo menos o nome fantasia e o CNPJ do hospital.',
        variant: 'destructive',
      });
      return;
    }

    const cnpjDigits = formData.cnpj.replace(/\D/g, '');
    if (cnpjDigits.length !== 14) {
      toast({
        title: 'CNPJ inválido',
        description: 'O CNPJ deve ter 14 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    // Validate gestor fields if email is provided
    if (formData.email_gestor.trim()) {
      if (!formData.nome_gestor.trim()) {
        toast({
          title: 'Nome do gestor obrigatório',
          description: 'Informe o nome do gestor para criar o acesso.',
          variant: 'destructive',
        });
        return;
      }
      if (!formData.senha_gestor || formData.senha_gestor.length < 6) {
        toast({
          title: 'Senha do gestor inválida',
          description: 'A senha deve ter pelo menos 6 caracteres.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);

    // Generate random 6-char access code
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = 'HOS';
      for (let i = 0; i < 3; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    const codigoAcesso = generateCode();

    const { data: newHospital, error } = await supabase
      .from('hospitals')
      .insert({
        name: formData.name.trim(),
        cnpj: cnpjDigits,
        codigo_acesso: codigoAcesso,
        razao_social: formData.razao_social.trim() || null,
        email_contato: formData.email_contato.trim() || null,
        telefone: formData.telefone.replace(/\D/g, '') || null,
        cep: formData.cep.replace(/\D/g, '') || null,
        endereco: formData.endereco.trim() || null,
        numero: formData.numero.trim() || null,
        bairro: formData.bairro.trim() || null,
        cidade: formData.cidade.trim() || null,
        uf: formData.uf || null,
        nome_gestor: formData.nome_gestor.trim() || null,
        dados_faturamento: formData.dados_faturamento.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao cadastrar hospital:', error);
      if (error.message.includes('duplicate')) {
        toast({
          title: 'CNPJ já cadastrado',
          description: 'Já existe um hospital com este CNPJ.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao cadastrar',
          description: error.message,
          variant: 'destructive',
        });
      }
      setIsSubmitting(false);
      return;
    }

    // If gestor email was provided, create the admin user
    if (formData.email_gestor.trim() && newHospital) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-hospital-admin`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionData.session?.access_token}`,
            },
            body: JSON.stringify({
              hospital_id: newHospital.id,
              email: formData.email_gestor.trim(),
              password: formData.senha_gestor,
              full_name: formData.nome_gestor.trim(),
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          toast({
            title: 'Hospital cadastrado, mas houve erro ao criar gestor',
            description: result.error || 'Erro ao criar conta do gestor.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Hospital cadastrado com sucesso!',
            description: `${formData.name} foi adicionado. Código de acesso: ${codigoAcesso}. Gestor ${formData.email_gestor} já pode fazer login.`,
          });
        }
      } catch (err) {
        console.error('Erro ao criar gestor:', err);
        toast({
          title: 'Hospital cadastrado',
          description: `${formData.name} foi adicionado com código ${codigoAcesso}, mas houve erro ao criar conta do gestor.`,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Hospital cadastrado',
        description: `${formData.name} foi adicionado com sucesso. Código de acesso: ${codigoAcesso}`,
      });
    }

    setFormData(initialFormData);
    setIsDialogOpen(false);
    fetchHospitals();
    setIsSubmitting(false);
  };

  const formatDisplayCnpj = (cnpj: string) => {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) return cnpj;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingHospital(null);
  };

  const handleEditHospital = (hospital: Hospital) => {
    setEditingHospital(hospital);
    setFormData({
      name: hospital.name,
      cnpj: formatCnpj(hospital.cnpj),
      razao_social: hospital.razao_social || '',
      email_contato: hospital.email_contato || '',
      telefone: hospital.telefone ? formatTelefone(hospital.telefone) : '',
      cep: hospital.cep ? formatCep(hospital.cep) : '',
      endereco: hospital.endereco || '',
      numero: hospital.numero || '',
      bairro: hospital.bairro || '',
      cidade: hospital.cidade || '',
      uf: hospital.uf || '',
      nome_gestor: hospital.nome_gestor || '',
      email_gestor: '',
      senha_gestor: '',
      dados_faturamento: hospital.dados_faturamento || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateHospital = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingHospital) return;

    if (!formData.name.trim() || !formData.cnpj.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha pelo menos o nome fantasia e o CNPJ do hospital.',
        variant: 'destructive',
      });
      return;
    }

    const cnpjDigits = formData.cnpj.replace(/\D/g, '');
    if (cnpjDigits.length !== 14) {
      toast({
        title: 'CNPJ inválido',
        description: 'O CNPJ deve ter 14 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('hospitals')
      .update({
        name: formData.name.trim(),
        cnpj: cnpjDigits,
        razao_social: formData.razao_social.trim() || null,
        email_contato: formData.email_contato.trim() || null,
        telefone: formData.telefone.replace(/\D/g, '') || null,
        cep: formData.cep.replace(/\D/g, '') || null,
        endereco: formData.endereco.trim() || null,
        numero: formData.numero.trim() || null,
        bairro: formData.bairro.trim() || null,
        cidade: formData.cidade.trim() || null,
        uf: formData.uf || null,
        nome_gestor: formData.nome_gestor.trim() || null,
        dados_faturamento: formData.dados_faturamento.trim() || null,
      })
      .eq('id', editingHospital.id);

    if (error) {
      console.error('Erro ao atualizar hospital:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: 'Hospital atualizado',
      description: `${formData.name} foi atualizado com sucesso.`,
    });

    resetForm();
    setIsEditDialogOpen(false);
    fetchHospitals();
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-primary shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">Zelo</h1>
              <p className="text-sm text-primary-foreground/80">Super Admin</p>
            </div>
          </div>
          <Button variant="secondary" onClick={signOut} className="shadow-soft">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">Hospitais Cadastrados</h2>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="shadow-soft">
                <Plus className="w-4 h-4 mr-2" />
                Novo Hospital
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border shadow-card max-w-2xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="text-foreground">Cadastrar Novo Hospital</DialogTitle>
                <DialogDescription>
                  Preencha os dados do hospital para realizar o cadastro.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <form onSubmit={handleSubmit} id="hospital-form">
                  <div className="space-y-6 py-4">
                    {/* Dados Gerais */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4" />
                        Dados Gerais
                      </h3>
                      <div className="space-y-4 pl-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome Fantasia *</Label>
                            <Input
                              id="name"
                              placeholder="Ex: Hospital São Lucas"
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="razao_social">Razão Social</Label>
                            <Input
                              id="razao_social"
                              placeholder="Razão social completa"
                              value={formData.razao_social}
                              onChange={(e) => handleInputChange('razao_social', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cnpj">CNPJ *</Label>
                            <Input
                              id="cnpj"
                              placeholder="00.000.000/0000-00"
                              value={formData.cnpj}
                              onChange={(e) => handleInputChange('cnpj', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="telefone">Telefone</Label>
                            <Input
                              id="telefone"
                              placeholder="(00) 00000-0000"
                              value={formData.telefone}
                              onChange={(e) => handleInputChange('telefone', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email_contato">E-mail de Contato</Label>
                          <Input
                            id="email_contato"
                            type="email"
                            placeholder="contato@hospital.com.br"
                            value={formData.email_contato}
                            onChange={(e) => handleInputChange('email_contato', e.target.value)}
                            disabled={isSubmitting}
                            className="bg-background"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Endereço */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4" />
                        Endereço
                      </h3>
                      <div className="space-y-4 pl-6">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cep">CEP</Label>
                            <Input
                              id="cep"
                              placeholder="00000-000"
                              value={formData.cep}
                              onChange={(e) => handleInputChange('cep', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label htmlFor="endereco">Logradouro</Label>
                            <Input
                              id="endereco"
                              placeholder="Rua, Avenida..."
                              value={formData.endereco}
                              onChange={(e) => handleInputChange('endereco', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="numero">Número</Label>
                            <Input
                              id="numero"
                              placeholder="123"
                              value={formData.numero}
                              onChange={(e) => handleInputChange('numero', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                          <div className="col-span-3 space-y-2">
                            <Label htmlFor="bairro">Bairro</Label>
                            <Input
                              id="bairro"
                              placeholder="Bairro"
                              value={formData.bairro}
                              onChange={(e) => handleInputChange('bairro', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-2 space-y-2">
                            <Label htmlFor="cidade">Cidade</Label>
                            <Input
                              id="cidade"
                              placeholder="Cidade"
                              value={formData.cidade}
                              onChange={(e) => handleInputChange('cidade', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="uf">UF</Label>
                            <Select
                              value={formData.uf}
                              onValueChange={(value) => handleInputChange('uf', value)}
                              disabled={isSubmitting}
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="UF" />
                              </SelectTrigger>
                              <SelectContent>
                                {UF_OPTIONS.map(uf => (
                                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Gestor */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                        <User className="w-4 h-4" />
                        Gestor Responsável (Primeiro Acesso)
                      </h3>
                      <div className="space-y-4 pl-6">
                        <div className="space-y-2">
                          <Label htmlFor="nome_gestor">Nome do Gestor *</Label>
                          <Input
                            id="nome_gestor"
                            placeholder="Nome completo do gestor"
                            value={formData.nome_gestor}
                            onChange={(e) => handleInputChange('nome_gestor', e.target.value)}
                            disabled={isSubmitting}
                            className="bg-background"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="email_gestor">E-mail do Gestor *</Label>
                            <Input
                              id="email_gestor"
                              type="email"
                              placeholder="gestor@hospital.com.br"
                              value={formData.email_gestor}
                              onChange={(e) => handleInputChange('email_gestor', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="senha_gestor">Senha Inicial *</Label>
                            <Input
                              id="senha_gestor"
                              type="password"
                              placeholder="Mínimo 6 caracteres"
                              value={formData.senha_gestor}
                              onChange={(e) => handleInputChange('senha_gestor', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                        </div>
                        
                        {formData.email_gestor && formData.senha_gestor && formData.nome_gestor && (
                          <Alert variant="default" className="bg-green-50 border-green-200">
                            <AlertCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                              Uma conta será criada automaticamente para o gestor com as credenciais informadas.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Faturamento */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        Dados de Faturamento
                      </h3>
                      <div className="pl-6">
                        <Textarea
                          id="dados_faturamento"
                          placeholder="Informações adicionais para faturamento..."
                          value={formData.dados_faturamento}
                          onChange={(e) => handleInputChange('dados_faturamento', e.target.value)}
                          disabled={isSubmitting}
                          className="bg-background min-h-[80px]"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </ScrollArea>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)} 
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  form="hospital-form"
                  disabled={isSubmitting} 
                  className="shadow-soft"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Cadastrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Hospital Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogContent className="bg-card border-border shadow-card max-w-2xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="text-foreground">Editar Hospital</DialogTitle>
                <DialogDescription>
                  Atualize os dados do hospital.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <form onSubmit={handleUpdateHospital} id="hospital-edit-form">
                  <div className="space-y-6 py-4">
                    {/* Dados Gerais */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4" />
                        Dados Gerais
                      </h3>
                      <div className="space-y-4 pl-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Nome Fantasia *</Label>
                            <Input
                              id="edit-name"
                              placeholder="Ex: Hospital São Lucas"
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-razao_social">Razão Social</Label>
                            <Input
                              id="edit-razao_social"
                              placeholder="Razão social completa"
                              value={formData.razao_social}
                              onChange={(e) => handleInputChange('razao_social', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-cnpj">CNPJ *</Label>
                            <Input
                              id="edit-cnpj"
                              placeholder="00.000.000/0000-00"
                              value={formData.cnpj}
                              onChange={(e) => handleInputChange('cnpj', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-telefone">Telefone</Label>
                            <Input
                              id="edit-telefone"
                              placeholder="(00) 00000-0000"
                              value={formData.telefone}
                              onChange={(e) => handleInputChange('telefone', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-email_contato">E-mail de Contato</Label>
                          <Input
                            id="edit-email_contato"
                            type="email"
                            placeholder="contato@hospital.com.br"
                            value={formData.email_contato}
                            onChange={(e) => handleInputChange('email_contato', e.target.value)}
                            disabled={isSubmitting}
                            className="bg-background"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Endereço */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4" />
                        Endereço
                      </h3>
                      <div className="space-y-4 pl-6">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-cep">CEP</Label>
                            <Input
                              id="edit-cep"
                              placeholder="00000-000"
                              value={formData.cep}
                              onChange={(e) => handleInputChange('cep', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label htmlFor="edit-endereco">Logradouro</Label>
                            <Input
                              id="edit-endereco"
                              placeholder="Rua, Avenida..."
                              value={formData.endereco}
                              onChange={(e) => handleInputChange('endereco', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-numero">Número</Label>
                            <Input
                              id="edit-numero"
                              placeholder="123"
                              value={formData.numero}
                              onChange={(e) => handleInputChange('numero', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                          <div className="col-span-3 space-y-2">
                            <Label htmlFor="edit-bairro">Bairro</Label>
                            <Input
                              id="edit-bairro"
                              placeholder="Bairro"
                              value={formData.bairro}
                              onChange={(e) => handleInputChange('bairro', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-2 space-y-2">
                            <Label htmlFor="edit-cidade">Cidade</Label>
                            <Input
                              id="edit-cidade"
                              placeholder="Cidade"
                              value={formData.cidade}
                              onChange={(e) => handleInputChange('cidade', e.target.value)}
                              disabled={isSubmitting}
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-uf">UF</Label>
                            <Select
                              value={formData.uf}
                              onValueChange={(value) => handleInputChange('uf', value)}
                              disabled={isSubmitting}
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="UF" />
                              </SelectTrigger>
                              <SelectContent>
                                {UF_OPTIONS.map(uf => (
                                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Gestor */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                        <User className="w-4 h-4" />
                        Gestor Responsável
                      </h3>
                      <div className="space-y-4 pl-6">
                        <div className="space-y-2">
                          <Label htmlFor="edit-nome_gestor">Nome do Gestor</Label>
                          <Input
                            id="edit-nome_gestor"
                            placeholder="Nome completo"
                            value={formData.nome_gestor}
                            onChange={(e) => handleInputChange('nome_gestor', e.target.value)}
                            disabled={isSubmitting}
                            className="bg-background"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Faturamento */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        Dados de Faturamento
                      </h3>
                      <div className="pl-6">
                        <Textarea
                          id="edit-dados_faturamento"
                          placeholder="Informações adicionais para faturamento..."
                          value={formData.dados_faturamento}
                          onChange={(e) => handleInputChange('dados_faturamento', e.target.value)}
                          disabled={isSubmitting}
                          className="bg-background min-h-[80px]"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </ScrollArea>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)} 
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  form="hospital-edit-form"
                  disabled={isSubmitting} 
                  className="shadow-soft"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Pencil className="w-4 h-4 mr-2" />
                  )}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : hospitals.length === 0 ? (
          <Card className="bg-card border-border shadow-card">
            <CardContent className="py-12 text-center">
              <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Nenhum hospital cadastrado</h3>
              <p className="text-muted-foreground">Clique no botão acima para cadastrar o primeiro hospital.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground">Lista de Hospitais</CardTitle>
              <CardDescription>{hospitals.length} hospital(is) cadastrado(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Código de Acesso</TableHead>
                    <TableHead>Gestor</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitals.map((hospital) => (
                    <TableRow key={hospital.id}>
                      <TableCell className="font-medium">{hospital.name}</TableCell>
                      <TableCell>{formatDisplayCnpj(hospital.cnpj)}</TableCell>
                      <TableCell>
                        {hospital.cidade && hospital.uf 
                          ? `${hospital.cidade}/${hospital.uf}` 
                          : hospital.cidade || '-'}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                          {hospital.codigo_acesso}
                        </span>
                      </TableCell>
                      <TableCell>{hospital.nome_gestor || '-'}</TableCell>
                      <TableCell>
                        {new Date(hospital.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditHospital(hospital)}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
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
