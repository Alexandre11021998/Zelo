import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartHandshake, Users, ClipboardList, LogOut, Building2, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { signOut, user, isSuperAdmin, isAdmin } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [hospitalName, setHospitalName] = useState<string | null>(null);
  const [hospitalCode, setHospitalCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchHospitalInfo = async () => {
      if (profile?.hospital_id) {
        const { data } = await supabase
          .from('hospitals')
          .select('name, codigo_acesso')
          .eq('id', profile.hospital_id)
          .single();
        
        if (data) {
          setHospitalName(data.name);
          setHospitalCode(data.codigo_acesso);
        }
      }
    };

    fetchHospitalInfo();
  }, [profile?.hospital_id]);

  const handleCopyCode = () => {
    if (hospitalCode) {
      navigator.clipboard.writeText(hospitalCode);
      setCopied(true);
      toast({
        title: 'Código copiado!',
        description: 'Compartilhe com novos colaboradores.',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">Zelo</h1>
              <p className="text-sm text-primary-foreground/80">
                {hospitalName || 'Painel do Gestor'}
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={signOut} className="shadow-soft">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Bem-vindo, {profile?.full_name?.split(' ')[0] || 'Gestor'}!
            </h2>
            <p className="text-muted-foreground">
              Gerencie sua equipe e acompanhe os pacientes do hospital.
            </p>
          </div>

          {/* Hospital Code Card */}
          {hospitalCode && (
            <Card className="mb-8 bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Código do Hospital</p>
                      <p className="font-mono text-lg font-bold text-foreground tracking-widest">
                        {hospitalCode}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar Código
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Compartilhe este código com novos colaboradores para que possam se cadastrar.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Manage Team Card */}
            <Card className="bg-card border border-border shadow-card hover:shadow-soft transition-all duration-200">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4 shadow-soft">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-foreground">Gerenciar Equipe</CardTitle>
                <CardDescription>
                  Cadastre e gerencie os colaboradores do hospital
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/equipe">
                  <Button className="w-full shadow-soft" size="lg">
                    Acessar Equipe
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Patient List Card */}
            <Card className="bg-card border border-border shadow-card hover:shadow-soft transition-all duration-200">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-companion flex items-center justify-center mb-4 shadow-soft">
                  <ClipboardList className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-foreground">Lista de Pacientes</CardTitle>
                <CardDescription>
                  Visualize e gerencie os pacientes internados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/gestao-hospitalar">
                  <Button className="w-full" size="lg" variant="outline">
                    Ver Pacientes
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* SuperAdmin quick access */}
          {isSuperAdmin && (
            <div className="mt-8">
              <Link to="/superadmin">
                <Button variant="ghost" className="w-full text-muted-foreground">
                  <Building2 className="w-4 h-4 mr-2" />
                  Gerenciar Hospitais (SuperAdmin)
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
