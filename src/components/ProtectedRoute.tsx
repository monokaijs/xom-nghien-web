'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Shield, User } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoggedIn, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
            <p className="text-neutral-300">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">
              Authentication Required
            </h1>
            
            <p className="text-neutral-300 mb-6">
              You need to sign in with Steam to access the skin changer feature.
            </p>
            
            <Button
              onClick={login}
              className="w-full bg-[#171a21] hover:bg-[#2a475e] text-white border border-[#4c6b22] transition-colors"
            >
              <User className="w-5 h-5 mr-2" />
              Sign in with Steam
            </Button>
            
            <p className="text-sm text-neutral-400 mt-4">
              We use Steam OpenID for secure authentication. Your Steam credentials are never stored on our servers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
