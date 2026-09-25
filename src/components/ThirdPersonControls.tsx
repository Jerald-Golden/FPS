import { ReactNode, createContext, useContext } from 'react';

export const isThirdPerson = createContext<boolean>(false);
export const isThirdPersonContext = isThirdPerson;
export const IsThirdPersonContext = isThirdPerson;
export const ThirdPersonContext = isThirdPerson;

export function useIsThirdPerson(): boolean {
  return useContext(isThirdPerson);
}

export function useThirdPerson(): { isThirdPerson: boolean } {
  return { isThirdPerson: useContext(isThirdPerson) };
}

interface ThirdPersonControlsProps {
  children?: ReactNode;
  enabled?: boolean;
}

export function ThirdPersonControls({ children, enabled = true }: ThirdPersonControlsProps) {
  return (
    <isThirdPerson.Provider value={enabled}>
      {children}
    </isThirdPerson.Provider>
  );
}

export default ThirdPersonControls;
