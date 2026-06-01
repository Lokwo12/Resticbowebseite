import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';

type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type ConfirmContextType = {
  confirm: (options?: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [resolveFn, setResolveFn] = useState<(value: boolean) => void>(() => {});

  const confirm = (opts?: ConfirmOptions): Promise<boolean> => {
    setOptions(opts || {});
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolveFn(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolveFn(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveFn(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <AlertDialog.Root open={isOpen} onOpenChange={(open) => {
        if (!open) handleCancel();
      }}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] animate-in fade-in" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6 animate-in zoom-in-95 fade-in duration-200">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${options.destructive !== false ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {options.destructive !== false ? <Trash2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                </div>
                <div className="pt-1">
                  <AlertDialog.Title className="text-lg font-semibold text-slate-900">
                    {options.title || 'Are you absolutely sure?'}
                  </AlertDialog.Title>
                  <AlertDialog.Description className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {options.message || 'This action cannot be undone. This will permanently delete your data from our servers.'}
                  </AlertDialog.Description>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <AlertDialog.Cancel asChild>
                  <Button variant="outline" onClick={handleCancel} className="rounded-xl">
                    {options.cancelText || 'Cancel'}
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <Button
                    onClick={handleConfirm}
                    className={`rounded-xl ${options.destructive !== false ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/20' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20'}`}
                  >
                    {options.confirmText || 'Yes, Delete'}
                  </Button>
                </AlertDialog.Action>
              </div>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}
