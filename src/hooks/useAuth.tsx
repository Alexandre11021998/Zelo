import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isColaborador: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isColaborador, setIsColaborador] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkRoles = async (userId: string) => {
    console.log('Verificando roles para user:', userId);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Erro ao verificar roles:', error.message);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsColaborador(false);
        return;
      }
      
      console.log('Resultado da verificação de roles:', data);
      const roles = data?.map(r => r.role) || [];
      setIsAdmin(roles.includes('admin'));
      setIsSuperAdmin(roles.includes('superadmin'));
      setIsColaborador(roles.includes('colaborador'));
    } catch (err) {
      console.error('Erro inesperado ao verificar roles:', err);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsColaborador(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Configura o listener PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Usa setTimeout para evitar deadlock
          setTimeout(async () => {
            if (isMounted) {
              await checkRoles(session.user.id);
              setLoading(false);
            }
          }, 0);
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsColaborador(false);
          setLoading(false);
        }
      }
    );

    // DEPOIS verifica sessão existente
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao buscar sessão:', error.message);
          if (isMounted) setLoading(false);
          return;
        }

        console.log('Sessão existente:', session?.user?.email);
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await checkRoles(session.user.id);
        }
      } catch (err) {
        console.error('Erro inesperado ao inicializar auth:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isSuperAdmin, isColaborador, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
