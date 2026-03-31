import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

export type FontSize = 'normal' | 'large' | 'xlarge' | 'xxlarge';

interface AccessibilityContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
}

const FONT_SIZE_MAP: Record<FontSize, string> = {
  normal: '14px',
  large: '16px',
  xlarge: '18px',
  xxlarge: '20px',
};

const FONT_SCALE_MAP: Record<FontSize, number> = {
  normal: 1,
  large: 1.15,
  xlarge: 1.3,
  xxlarge: 1.5,
};

const A11Y_KEY = 'bookmgr_font_size';
const CONTRAST_KEY = 'bookmgr_high_contrast';

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const saved = localStorage.getItem(A11Y_KEY);
    if (saved && (saved === 'normal' || saved === 'large' || saved === 'xlarge' || saved === 'xxlarge')) {
      return saved;
    }
    return 'normal';
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem(CONTRAST_KEY) === 'true';
  });

  function setFontSize(size: FontSize) {
    setFontSizeState(size);
    localStorage.setItem(A11Y_KEY, size);
    applyStyles(size, highContrast);
  }

  function setHighContrast(enabled: boolean) {
    setHighContrastState(enabled);
    localStorage.setItem(CONTRAST_KEY, String(enabled));
    applyStyles(fontSize, enabled);
  }

  // Apply styles on mount
  useEffect(() => {
    applyStyles(fontSize, highContrast);
  }, []);

  return (
    <AccessibilityContext.Provider value={{ fontSize, setFontSize, highContrast, setHighContrast }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

function applyStyles(fontSize: FontSize, highContrast: boolean) {
  const root = document.documentElement;
  const scale = FONT_SCALE_MAP[fontSize];
  const baseFontSize = FONT_SIZE_MAP[fontSize];

  // Set base font size
  root.style.setProperty('--base-font-size', baseFontSize);
  root.style.fontSize = baseFontSize;

  // Set font scale for components
  root.style.setProperty('--font-scale', String(scale));

  // Apply high contrast
  if (highContrast) {
    root.classList.add('high-contrast');
    root.classList.remove('normal-contrast');
  } else {
    root.classList.remove('high-contrast');
    root.classList.add('normal-contrast');
  }
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}

// Helper to get font size label
export const FONT_SIZE_LABELS: Record<FontSize, string> = {
  normal: '正常 (1x)',
  large: '大 (1.15x)',
  xlarge: '特大 (1.3x)',
  xxlarge: '超大 (1.5x)',
};
