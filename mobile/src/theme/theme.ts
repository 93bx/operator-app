import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976d2',
    primaryContainer: '#e3f2fd',
    secondary: '#03dac6',
    secondaryContainer: '#e0f2f1',
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    background: '#fafafa',
    error: '#b00020',
    errorContainer: '#fdeaea',
    onPrimary: '#ffffff',
    onSecondary: '#000000',
    onSurface: '#1c1b1f',
    onBackground: '#1c1b1f',
    onError: '#ffffff',
    outline: '#79747e',
    outlineVariant: '#cac4d0',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90caf9',
    primaryContainer: '#1565c0',
    secondary: '#03dac6',
    secondaryContainer: '#00695c',
    surface: '#121212',
    surfaceVariant: '#1e1e1e',
    background: '#000000',
    error: '#cf6679',
    errorContainer: '#b00020',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onSurface: '#e6e1e5',
    onBackground: '#e6e1e5',
    onError: '#000000',
    outline: '#938f99',
    outlineVariant: '#49454f',
  },
};

export const theme = lightTheme;
