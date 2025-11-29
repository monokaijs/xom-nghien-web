"use client";

import {SessionProvider} from "next-auth/react";
import {ReactNode} from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({children}: AuthProviderProps) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      {children}
    </SessionProvider>
  );
}
