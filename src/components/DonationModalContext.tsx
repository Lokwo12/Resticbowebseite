import { createContext, useContext, useState, type ReactNode } from 'react';

interface DonationModalContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const DonationModalContext = createContext<DonationModalContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function DonationModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DonationModalContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </DonationModalContext.Provider>
  );
}

export function useDonationModal() {
  return useContext(DonationModalContext);
}