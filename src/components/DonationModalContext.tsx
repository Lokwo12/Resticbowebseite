import { createContext, useContext, useState, type ReactNode } from 'react';

export type DonationMethodOption = 'card' | 'paypal' | 'mtn' | 'airtel' | 'bank';

export interface OpenDonationModalOptions {
  method?: DonationMethodOption;
  amount?: number;
}

export type OpenDonationModalFn = (optionsOrEvent?: OpenDonationModalOptions | React.MouseEvent | any) => void;

interface DonationModalContextValue {
  isOpen: boolean;
  initialMethod?: DonationMethodOption;
  initialAmount?: number;
  open: OpenDonationModalFn;
  close: () => void;
}

const DonationModalContext = createContext<DonationModalContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function DonationModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMethod, setInitialMethod] = useState<DonationMethodOption | undefined>();
  const [initialAmount, setInitialAmount] = useState<number | undefined>();

  const open: OpenDonationModalFn = (optionsOrEvent?: any) => {
    if (
      optionsOrEvent && 
      typeof optionsOrEvent === 'object' && 
      !('nativeEvent' in optionsOrEvent) && 
      !('preventDefault' in optionsOrEvent)
    ) {
      if (optionsOrEvent.method) setInitialMethod(optionsOrEvent.method);
      else setInitialMethod(undefined);

      if (optionsOrEvent.amount) setInitialAmount(optionsOrEvent.amount);
      else setInitialAmount(undefined);
    } else {
      setInitialMethod(undefined);
      setInitialAmount(undefined);
    }

    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };


  return (
    <DonationModalContext.Provider value={{ isOpen, initialMethod, initialAmount, open, close }}>
      {children}
    </DonationModalContext.Provider>
  );
}

export function useDonationModal() {
  return useContext(DonationModalContext);
}