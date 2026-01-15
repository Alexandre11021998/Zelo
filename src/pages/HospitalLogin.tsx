import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Loader2, AlertCircle, HeartHandshake } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export default function HospitalLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const { signIn, user, isAdmin, isColaborador, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      if (isAdmin) {
        // Gestor vai para dashboard com opções
        navigate('/dashboard', { replace: true });
      } else if (isColaborador) {
        // Colaborador vai direto para lista de pacientes
        navigate('/gestao-hospitalar', { replace: true });
      }
    }
  }, [user, isAdmin, isColaborador, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setErrorMessage(error.message);
        toast({
          title: 'Erro ao entrar',
          description: error.message,
          variant: 'destructive',
        });
        setLoading(false);
      } else {
        toast({
          title: 'Login realizado',
          description: 'Verificando permissões...',
        });
        // O loading será resetado pelo useEffect quando authLoading mudar
      }
    } catch (err) {
      setErrorMessage('Ocorreu um erro inesperado. Tente novamente.');
      setLoading(false);
    }
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
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-foreground">Área do Hospital</CardTitle>
            <CardDescription>
              Acesso para gestores e colaboradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Senha</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="bg-background"
                />
              </div>
              <Button type="submit" className="w-full shadow-soft" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Primeiro acesso?{' '}
              <Link to="/cadastro-colaborador" className="text-primary font-medium hover:underline">
                Cadastrar-se
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
