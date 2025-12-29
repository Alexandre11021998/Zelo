import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCheck, Upload, Loader2 } from 'lucide-react';

export default function CheckIn() {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [convenio, setConvenio] = useState('');
  const [documento, setDocumento] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    if (formatted.length <= 14) {
      setCpf(formatted);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || !cpf.trim() || !convenio.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    if (cpf.replace(/\D/g, '').length !== 11) {
      toast({
        title: 'CPF inválido',
        description: 'O CPF deve conter 11 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let documentoUrl = null;

      if (documento) {
        const fileExt = documento.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('documentos')
          .upload(fileName, documento);

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrl } = supabase.storage
          .from('documentos')
          .getPublicUrl(fileName);

        documentoUrl = publicUrl.publicUrl;
      }

      const { error } = await supabase
        .from('pre_checkin')
        .insert({
          nome: nome.trim(),
          cpf: cpf.replace(/\D/g, ''),
          convenio: convenio.trim(),
          documento_url: documentoUrl,
          status: 'Pendente',
        });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: 'Check-in realizado!',
        description: 'Seus dados foram enviados com sucesso.',
      });

      // Reset form
      setNome('');
      setCpf('');
      setConvenio('');
      setDocumento(null);
    } catch (error: any) {
      console.error('Erro ao realizar check-in:', error);
      toast({
        title: 'Erro ao realizar check-in',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <ClipboardCheck className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Check-in Realizado!</CardTitle>
            <CardDescription>
              Seus dados foram enviados com sucesso. Aguarde ser chamado pela recepção.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setSuccess(false)} variant="outline" className="w-full">
              Fazer novo check-in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
            <ClipboardCheck className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Check-in do Paciente</CardTitle>
          <CardDescription>
            Preencha seus dados para realizar o pré-cadastro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome completo"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="convenio">Convênio *</Label>
              <Input
                id="convenio"
                value={convenio}
                onChange={(e) => setConvenio(e.target.value)}
                placeholder="Nome do convênio ou Particular"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documento">Foto do Documento</Label>
              <div className="relative">
                <Input
                  id="documento"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setDocumento(e.target.files?.[0] || null)}
                  disabled={loading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => document.getElementById('documento')?.click()}
                  disabled={loading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {documento ? documento.name : 'Selecionar ou tirar foto'}
                </Button>
              </div>
              {documento && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {documento.name}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Realizar Check-in'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
