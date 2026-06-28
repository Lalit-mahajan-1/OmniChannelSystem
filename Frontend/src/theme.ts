// Light Theme Configuration
export const lightTheme = {
  // Backgrounds
  bg: {
    primary: '#F5F7FA',
    secondary: '#FFFFFF',
    card: '#FFFFFF',
    hover: '#F9FAFB',
    active: '#F3F4F6',
    muted: '#F9FAFB',
  },
  
  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#374151',
    muted: '#6B7280',
    disabled: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  // Borders
  border: {
    default: '#E5E7EB',
    light: '#F3F4F6',
    dark: '#D1D5DB',
  },
  
  // Brand Colors
  brand: {
    primary: '#3ECF6A',
    primaryLight: '#B8F5CC',
    primaryDark: '#1FA84A',
    gradient: 'linear-gradient(135deg, #3ECF6A, #1FA84A)',
  },
  
  // Status Colors
  status: {
    success: '#10B981',
    successBg: '#D1FAE5',
    successText: '#065F46',
    
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    warningText: '#92400E',
    
    error: '#EF4444',
    errorBg: '#FEE2E2',
    errorText: '#991B1B',
    
    info: '#3B82F6',
    infoBg: '#DBEAFE',
    infoText: '#1E40AF',
  },
  
  // Shadows
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 1px 3px rgba(0,0,0,0.1)',
    lg: '0 4px 6px rgba(0,0,0,0.1)',
    xl: '0 8px 16px rgba(0,0,0,0.1)',
  },
};

export type Theme = typeof lightTheme;
