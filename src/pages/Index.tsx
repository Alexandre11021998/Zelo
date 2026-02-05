import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartHandshake, Building2, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-soft">
            <HeartHandshake className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Zelo</h1>
        </div>
        <p className="text-muted-foreground max-w-md mx-auto">
          Sistema de acompanhamento hospitalar em tempo real para pacientes e familiares
        </p>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Companion Card - Light Aqua/Surgical Green */}
          <Card className="bg-companion border border-companion/50 shadow-card hover:shadow-soft transition-all duration-200">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center mb-4 shadow-soft">
                <HeartHandshake className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-foreground">Acompanhar Paciente</CardTitle>
              <CardDescription className="text-companion-foreground">
                Consulte o status do seu familiar em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/acompanhante">
                <Button className="w-full shadow-soft" size="lg">
                  Consultar Status
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Hospital Area Card - Clean White */}
          <Card className="bg-card border border-border shadow-card hover:shadow-soft transition-all duration-200">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4 shadow-soft">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-foreground">Área do Hospital</CardTitle>
              <CardDescription>
                Acesso para gestores e colaboradores do hospital
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/login-hospital">
                <Button className="w-full" size="lg" variant="outline">
                  Acessar
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Discrete SuperAdmin Link */}
        <div className="text-center mt-16">
          <Link 
            to="/login-superadmin" 
            className="inline-flex items-center gap-2 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <Code2 className="w-3 h-3" />
            Área do Desenvolvedor
          </Link>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground text-sm">
        <p>© 2025 Zelo - Todos os direitos reservados</p>
      </footer>
    </div>
  );
};

export default Index;
