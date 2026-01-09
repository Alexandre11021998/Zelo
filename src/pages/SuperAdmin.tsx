import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Plus, LogOut, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Hospital {
  id: string;
  name: string;
  cnpj: string;
  created_at: string;
}

export default function SuperAdmin() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalCnpj, setHospitalCnpj] = useState('');
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

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHospitalCnpj(formatCnpj(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hospitalName.trim() || !hospitalCnpj.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome e o CNPJ do hospital.',
        variant: 'destructive',
      });
      return;
    }

    // Validate CNPJ format (14 digits)
    const cnpjDigits = hospitalCnpj.replace(/\D/g, '');
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
      .insert({
        name: hospitalName.trim(),
        cnpj: cnpjDigits, // Store only digits
      });

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
    } else {
      toast({
        title: 'Hospital cadastrado',
        description: `${hospitalName} foi adicionado com sucesso.`,
      });
      setHospitalName('');
      setHospitalCnpj('');
      setIsDialogOpen(false);
      fetchHospitals();
    }

    setIsSubmitting(false);
  };

  const formatDisplayCnpj = (cnpj: string) => {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) return cnpj;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-soft">
                <Plus className="w-4 h-4 mr-2" />
                Novo Hospital
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border shadow-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">Cadastrar Novo Hospital</DialogTitle>
                <DialogDescription>
                  Preencha os dados do hospital para realizar o cadastro.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="hospitalName">Nome do Hospital</Label>
                    <Input
                      id="hospitalName"
                      placeholder="Ex: Hospital São Lucas"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      disabled={isSubmitting}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hospitalCnpj">CNPJ</Label>
                    <Input
                      id="hospitalCnpj"
                      placeholder="00.000.000/0000-00"
                      value={hospitalCnpj}
                      onChange={handleCnpjChange}
                      disabled={isSubmitting}
                      className="bg-background"
                    />
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
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Cadastrar
                  </Button>
                </DialogFooter>
              </form>
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
                    <TableHead>Cadastrado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitals.map((hospital) => (
                    <TableRow key={hospital.id}>
                      <TableCell className="font-medium">{hospital.name}</TableCell>
                      <TableCell>{formatDisplayCnpj(hospital.cnpj)}</TableCell>
                      <TableCell>
                        {new Date(hospital.created_at).toLocaleDateString('pt-BR')}
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
