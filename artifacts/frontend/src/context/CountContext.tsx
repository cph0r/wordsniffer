import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CountContextType {
  totalParagraphs: number | null;
  setTotalParagraphs: (count: number) => void;
}

const CountContext = createContext<CountContextType | undefined>(undefined);

export function CountProvider({ children }: { children: ReactNode }) {
  const [totalParagraphs, setTotalParagraphs] = useState<number | null>(null);

  return (
    <CountContext.Provider value={{ totalParagraphs, setTotalParagraphs }}>
      {children}
    </CountContext.Provider>
  );
}

export function useParagraphCount() {
  const context = useContext(CountContext);
  if (context === undefined) {
    throw new Error('useParagraphCount must be used within a CountProvider');
  }
  return context;
}
