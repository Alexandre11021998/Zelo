import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartHandshake, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="container mx-auto px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <HeartHandshake className="w-10 h-10 text-primary" />
          <h1 className="text-3xl font-bold">Zelo</h1>
        </div>
        <p className="text-muted-foreground max-w-md mx-auto">
          Sistema de acompanhamento hospitalar em tempo real para pacientes e familiares
        </p>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <HeartHandshake className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Sou Acompanhante</CardTitle>
              <CardDescription>
                Acompanhe o status do seu familiar em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/acompanhante">
                <Button className="w-full" size="lg">
                  Acompanhar Paciente
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-foreground" />
              </div>
              <CardTitle>Equipe de Enfermagem</CardTitle>
              <CardDescription>
                Acesse o painel administrativo para gerenciar pacientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/login-admin">
                <Button className="w-full" size="lg" variant="secondary">
                  Acessar Painel
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground text-sm">
        <p>© 2025 Zelo - Todos os direitos reservados</p>
      </footer>
    </div>
  );
};

export default Index;
