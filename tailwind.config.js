/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background))',
        foreground: 'rgb(var(--foreground))',
        
        card: 'rgb(var(--card-bg))',
        'card-border': 'rgb(var(--card-border))',
        'card-fg': 'rgb(var(--card-fg))',
        
        input: 'rgb(var(--input-bg))',
        'input-border': 'rgb(var(--input-border))',
        'input-fg': 'rgb(var(--input-fg))',
        
        primary: 'rgb(var(--primary-bg))',
        'primary-fg': 'rgb(var(--primary-fg))',
        'primary-hover': 'rgb(var(--primary-hover))',
        'primary-50': 'rgb(var(--color-primary-50))',
        'primary-100': 'rgb(var(--color-primary-100))',
        'primary-500': 'rgb(var(--color-primary-500))',
        'primary-700': 'rgb(var(--color-primary-700))',
        
        secondary: 'rgb(var(--secondary-bg))',
        'secondary-fg': 'rgb(var(--secondary-fg))',
        'secondary-hover': 'rgb(var(--secondary-hover))',
        
        sidebar: 'rgb(var(--sidebar-bg))',
        'sidebar-border': 'rgb(var(--sidebar-border))',
        'sidebar-fg': 'rgb(var(--sidebar-fg))',
        'sidebar-hover': 'rgb(var(--sidebar-hover))',
        'sidebar-active': 'rgb(var(--sidebar-active))',
        'sidebar-active-fg': 'rgb(var(--sidebar-active-fg))',
        
        success: 'rgb(var(--color-success-500))',
        error: 'rgb(var(--color-error-500))',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      height: {
        header: 'var(--header-height)',
        'screen-header': 'calc(100vh - var(--header-height))',
      },
      width: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-collapsed-width)',
      },
      maxWidth: {
        sidebar: 'var(--sidebar-width)',
      },
      minWidth: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-collapsed-width)',
      },
      margin: {
        sidebar: 'var(--sidebar-width)',
      },
      padding: {
        sidebar: 'var(--sidebar-width)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function({ addUtilities }) {
      addUtilities({
        '.sidebar-link': {
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          transition: 'background-color 0.15s ease, color 0.15s ease',
        },
        '.sidebar-link.active': {
          backgroundColor: 'rgb(var(--sidebar-active))',
          color: 'rgb(var(--sidebar-active-fg))',
          fontWeight: '500',
        },
      });
    },
  ],
}