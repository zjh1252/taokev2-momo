'use client';

import { createContext, useContext, useState, useCallback } from 'react';

type FocusTarget = 'none' | 'phone' | 'code' | 'password' | 'confirm';

interface AuthOwlContextValue {
  focusTarget: FocusTarget;
  setFocusTarget: (target: FocusTarget) => void;
}

const AuthOwlContext = createContext<AuthOwlContextValue>({
  focusTarget: 'none',
  setFocusTarget: () => {}
});

export function AuthOwlProvider({ children }: { children: React.ReactNode }) {
  const [focusTarget, setFocusTargetState] = useState<FocusTarget>('none');

  const setFocusTarget = useCallback((target: FocusTarget) => {
    setFocusTargetState(target);
  }, []);

  return (
    <AuthOwlContext.Provider value={{ focusTarget, setFocusTarget }}>
      {children}
    </AuthOwlContext.Provider>
  );
}

export function useAuthOwl() {
  return useContext(AuthOwlContext);
}
