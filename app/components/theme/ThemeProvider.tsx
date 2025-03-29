'use client';

import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useMemo, useState, createContext, useContext, useEffect } from 'react';
import { PaletteMode } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

// Original Material UI theme definition with improvements for shadcn integration
const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode
          primary: {
            main: 'hsl(var(--primary))', // Using CSS variables for consistency with shadcn
            light: 'hsl(var(--primary-light))',
            dark: 'hsl(var(--primary-dark))',
            contrastText: 'hsl(var(--primary-foreground))',
          },
          secondary: {
            main: 'hsl(var(--secondary))',
            light: 'hsl(var(--secondary-light))',
            dark: 'hsl(var(--secondary-dark))',
            contrastText: 'hsl(var(--secondary-foreground))',
          },
          background: {
            default: 'hsl(var(--background))',
            paper: 'hsl(var(--card))',
          },
          text: {
            primary: 'hsl(var(--foreground))',
            secondary: 'hsl(var(--muted-foreground))',
          },
          error: {
            main: 'hsl(var(--destructive))',
            light: 'hsl(var(--destructive-light))',
            dark: 'hsl(var(--destructive-dark))',
            contrastText: 'hsl(var(--destructive-foreground))',
          },
          warning: {
            main: 'hsl(var(--warning))',
            contrastText: 'hsl(var(--warning-foreground))',
          },
          info: {
            main: 'hsl(var(--info))',
            contrastText: 'hsl(var(--info-foreground))',
          },
          success: {
            main: 'hsl(var(--success))',
            contrastText: 'hsl(var(--success-foreground))',
          },
          divider: 'hsl(var(--border))',
        }
      : {
          // Dark mode
          primary: {
            main: 'hsl(var(--primary))',
            light: 'hsl(var(--primary-light))',
            dark: 'hsl(var(--primary-dark))',
            contrastText: 'hsl(var(--primary-foreground))',
          },
          secondary: {
            main: 'hsl(var(--secondary))',
            light: 'hsl(var(--secondary-light))',
            dark: 'hsl(var(--secondary-dark))',
            contrastText: 'hsl(var(--secondary-foreground))',
          },
          background: {
            default: 'hsl(var(--background))',
            paper: 'hsl(var(--card))',
          },
          text: {
            primary: 'hsl(var(--foreground))',
            secondary: 'hsl(var(--muted-foreground))',
          },
          error: {
            main: 'hsl(var(--destructive))',
            light: 'hsl(var(--destructive-light))',
            dark: 'hsl(var(--destructive-dark))',
            contrastText: 'hsl(var(--destructive-foreground))',
          },
          warning: {
            main: 'hsl(var(--warning))',
            contrastText: 'hsl(var(--warning-foreground))',
          },
          info: {
            main: 'hsl(var(--info))',
            contrastText: 'hsl(var(--info-foreground))',
          },
          success: {
            main: 'hsl(var(--success))',
            contrastText: 'hsl(var(--success-foreground))',
          },
          divider: 'hsl(var(--border))',
        }),
  },
  typography: {
    fontFamily: '"Futura PT", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
      fontWeight: 700,
    },
    h4: {
      fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Futura PT Bold", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
    },
    button: {
      fontFamily: '"Futura PT", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
      textTransform: 'none' as const,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: mode === 'light' 
            ? '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 6px rgba(0, 0, 0, 0.07)'
            : '0px 2px 4px rgba(0, 0, 0, 0.2), 0px 4px 6px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid hsl(var(--border))`,
        },
        head: {
          fontWeight: 600,
          fontSize: '0.875rem',
          color: `hsl(var(--foreground))`,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& fieldset': {
            borderRadius: 8,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: `hsl(var(--primary))`,
          },
        },
      },
    },
  },
});

// Type definition for color mode context
type ColorModeContextType = {
  toggleColorMode: () => void;
  mode: PaletteMode;
};

// Create the color mode context
const ColorModeContext = createContext<ColorModeContextType>({
  toggleColorMode: () => {},
  mode: 'light',
});

// Custom hook to use the color mode context
export const useColorMode = () => useContext(ColorModeContext);

// CSS variables updater to maintain consistent theme between MUI and shadcn
const updateCssVariables = (mode: PaletteMode) => {
  // Light and dark mode color values
  const lightColors = {
    primary: '213 75% 27%', // #1a4971
    'primary-light': '213 56% 41%', // #2c6ca5
    'primary-dark': '213 75% 19%', // #0d3154
    'primary-foreground': '0 0% 100%', // #ffffff
    secondary: '210 27% 25%', // #2c3e50
    'secondary-light': '208 23% 37%', // #4a6072
    'secondary-dark': '210 33% 15%', // #1a2530
    'secondary-foreground': '0 0% 100%', // #ffffff
    background: '210 33% 97%', // #f5f7f9
    foreground: '218 6% 14%', // #202124
    'muted-foreground': '220 3% 39%', // #5f6368
    destructive: '0 70% 50%', // #d32f2f
    'destructive-light': '0 79% 63%', // #ef5350
    'destructive-dark': '0 68% 47%', // #c62828
    'destructive-foreground': '0 0% 100%', // #ffffff
    warning: '28 100% 47%', // #ed6c02
    'warning-foreground': '0 0% 0%', // #000000
    info: '199 98% 41%', // #0288d1
    'info-foreground': '0 0% 100%', // #ffffff
    success: '123 67% 34%', // #2e7d32
    'success-foreground': '0 0% 100%', // #ffffff
    border: '0 0% 90%', // rgba(0, 0, 0, 0.12)
    card: '0 0% 100%', // #ffffff
    'card-foreground': '218 6% 14%', // #202124
    accent: '210 40% 96.1%', // light accent background
    'accent-foreground': '222.2 47.4% 11.2%', // accent text
    popover: '0 0% 100%', // popover background
    'popover-foreground': '218 6% 14%', // popover text
    ring: '213 75% 27%', // focus ring color (primary)
  };

  const darkColors = {
    primary: '210 70% 52%', // #3a8bce
    'primary-light': '208 68% 61%', // #5ba3de
    'primary-dark': '210 70% 37%', // #1c5c9e
    'primary-foreground': '0 0% 100%', // #ffffff
    secondary: '210 26% 48%', // #5c7d9a
    'secondary-light': '205 22% 59%', // #7c97ae
    'secondary-dark': '210 33% 35%', // #3c5a76
    'secondary-foreground': '0 0% 100%', // #ffffff
    background: '0 0% 7%', // #121212
    foreground: '0 0% 88%', // #e1e1e1
    'muted-foreground': '0 0% 63%', // #a1a1a1
    destructive: '0 73% 61%', // #f44336
    'destructive-light': '0 100% 71%', // #ff6b6b
    'destructive-dark': '0 73% 41%', // #c62828
    'destructive-foreground': '0 0% 100%', // #ffffff
    warning: '36 100% 50%', // #ff9800
    'warning-foreground': '0 0% 0%', // #000000
    info: '199 98% 56%', // #29b6f6
    'info-foreground': '0 0% 100%', // #ffffff
    success: '122 39% 49%', // #4caf50
    'success-foreground': '0 0% 100%', // #ffffff
    border: '0 0% 20%', // rgba(255, 255, 255, 0.12)
    card: '0 0% 12%', // #1e1e1e
    'card-foreground': '0 0% 88%', // #e1e1e1
    accent: '217 19% 27%', // dark accent background
    'accent-foreground': '210 40% 98%', // accent text
    popover: '0 0% 12%', // popover background
    'popover-foreground': '0 0% 88%', // popover text
    ring: '210 70% 52%', // focus ring color (primary)
  };

  // Set root variables based on mode
  const colors = mode === 'light' ? lightColors : darkColors;
  const root = document.documentElement;
  
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
};

// Main ThemeProvider component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Use local storage to store theme preference
  const [mode, setMode] = useState<PaletteMode>('light');

  useEffect(() => {
    // Check for saved preference in localStorage
    const savedMode = localStorage.getItem('themeMode') as PaletteMode;
    if (savedMode) {
      setMode(savedMode);
    } else {
      // Check for system preference
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDarkMode ? 'dark' : 'light');
    }
  }, []);

  // Effect to update Tailwind's dark mode class and CSS variables
  useEffect(() => {
    // Apply dark class to html element for Tailwind/Shadcn UI
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Update CSS variables for theme consistency
    updateCssVariables(mode);
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <NextThemesProvider 
        attribute="class" 
        defaultTheme={mode} 
        enableSystem 
        disableTransitionOnChange
        value={{
          light: "light",
          dark: "dark",
          system: "system",
        }}
      >
        <MUIThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </MUIThemeProvider>
      </NextThemesProvider>
    </ColorModeContext.Provider>
  );
}