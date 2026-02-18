import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../styles/theme';

/**
 * Hook para acessar o tema atual baseado na preferência do sistema.
 */
export function useAppTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return isDark ? darkTheme : lightTheme;
}
