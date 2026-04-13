import React, { createContext, useCallback, useContext, useState } from 'react';

type SignupContextType = {
  firstName: string;
  lastName: string;
  ssn: string;
  phone: string;
  email: string;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setSsn: (v: string) => void;
  setPhone: (v: string) => void;
  setEmail: (v: string) => void;
  clear: () => void;
};

const SignupContext = createContext<SignupContextType | null>(null);

export function SignupProvider({ children }: { children: React.ReactNode }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [ssn, setSsn] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const clear = useCallback(() => {
    setFirstName('');
    setLastName('');
    setSsn('');
    setPhone('');
    setEmail('');
  }, []);

  return (
    <SignupContext.Provider
      value={{
        firstName,
        lastName,
        ssn,
        phone,
        email,
        setFirstName,
        setLastName,
        setSsn,
        setPhone,
        setEmail,
        clear,
      }}
    >
      {children}
    </SignupContext.Provider>
  );
}

export function useSignup() {
  const ctx = useContext(SignupContext);
  if (!ctx) throw new Error('useSignup must be used within SignupProvider');
  return ctx;
}
