import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CountContextType {
  totalParagraphs: number | null;
  setTotalParagraphs: (count: number) => void;
}

const CountContext = createContext<CountContextType | undefined>(undefined);

const API_BASE = "/python-api/api";

export function CountProvider({ children }: { children: ReactNode }) {
  const [totalParagraphs, setTotalParagraphs] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/dictionary`)
      .then((res) => res.json())
      .then((data) => {
        if (data.meta?.total_paragraphs !== undefined) {
          setTotalParagraphs(data.meta.total_paragraphs);
        }
      })
      .catch(() => {});
  }, []);

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
