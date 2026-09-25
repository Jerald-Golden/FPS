import { ReactNode, createContext, useContext } from 'react';

export const isFirstPerson = createContext<boolean>(false);
export const isFirstPersonContext = isFirstPerson;
export const IsFirstPersonContext = isFirstPerson;
export const FirstPersonContext = isFirstPerson;

export function useIsFirstPerson(): boolean {
  return useContext(isFirstPerson);
}

export function useFirstPerson(): { isFirstPerson: boolean } {
  return { isFirstPerson: useContext(isFirstPerson) };
}

interface FirstPersonControlsProps {
  children?: ReactNode;
  enabled?: boolean;
}

export function FirstPersonControls({ children, enabled = true }: FirstPersonControlsProps) {
  return (
    <isFirstPerson.Provider value={enabled}>
      {children}
    </isFirstPerson.Provider>
  );
}

export default FirstPersonControls;
