import { ReactNode, createContext, useContext } from 'react';

export const isTopDown = createContext<boolean>(false);
export const isTopDownContext = isTopDown;
export const IsTopDownContext = isTopDown;
export const TopDownContext = isTopDown;

export function useIsTopDown(): boolean {
  return useContext(isTopDown);
}

export function useTopDown(): { isTopDown: boolean } {
  return { isTopDown: useContext(isTopDown) };
}

interface TopDownControlsProps {
  children?: ReactNode;
  enabled?: boolean;
}

export function TopDownControls({ children, enabled = true }: TopDownControlsProps) {
  return (
    <isTopDown.Provider value={enabled}>
      {children}
    </isTopDown.Provider>
  );
}

export default TopDownControls;
