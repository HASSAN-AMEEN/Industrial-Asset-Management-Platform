import React from 'react';

interface DrawerContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const DrawerContext = React.createContext<DrawerContextValue | undefined>(undefined);

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <DrawerContext.Provider value={{ isOpen, open, close, toggle }}>{children}</DrawerContext.Provider>
  );
};

export const useDrawer = (): DrawerContextValue => {
  const ctx = React.useContext(DrawerContext);
  if (!ctx) {
    // Safe no-op fallback so screens never crash if rendered outside the provider.
    return { isOpen: false, open: () => {}, close: () => {}, toggle: () => {} };
  }
  return ctx;
};

export default DrawerContext;
