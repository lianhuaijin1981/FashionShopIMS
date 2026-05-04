/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // StyleStock Design System
        canvas: '#F8F5F2',
        surface: '#FFFFFF',
        'surface-alt': '#E9E6E1',
        'ink-primary': '#2D2926',
        'ink-secondary': '#6B6560',
        'ink-tertiary': '#A39E99',
        'accent-brand': '#D4853C',
        'accent-hover': '#BF7532',
        'accent-subtle': 'rgba(212, 133, 60, 0.12)',
        alert: '#C75C3A',
        'alert-subtle': 'rgba(199, 92, 58, 0.10)',
        success: '#4A9B8E',
        'success-subtle': 'rgba(74, 155, 142, 0.10)',
        divider: 'rgba(45, 41, 38, 0.08)',
        'sidebar-bg': '#F0EDE8',
        'sidebar-active': '#FFFFFF',
        'border-subtle': 'rgba(45, 41, 38, 0.12)',
        overlay: 'rgba(45, 41, 38, 0.40)',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        card: '0 1px 3px rgba(45, 41, 38, 0.06)',
        'card-hover': '0 4px 16px rgba(45, 41, 38, 0.10)',
        'sidebar-item': '0 1px 3px rgba(45, 41, 38, 0.08)',
        'button-primary': '0 2px 8px rgba(212, 133, 60, 0.30)',
        modal: '0 20px 60px rgba(45, 41, 38, 0.15)',
        dropdown: '0 8px 32px rgba(45, 41, 38, 0.12)',
        toast: '0 8px 24px rgba(45, 41, 38, 0.15)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "stat-glow-pulse": {
          "0%, 100%": { boxShadow: '0 0 8px 2px rgba(212, 133, 60, 0.30)' },
          "50%": { boxShadow: '0 0 8px 2px rgba(212, 133, 60, 0.80)' },
        },
        "drift": {
          "0%": { transform: 'translate(0, 0)' },
          "100%": { transform: 'translate(2%, -2%)' },
        },
        "drift-reverse": {
          "0%": { transform: 'translate(0, 0)' },
          "100%": { transform: 'translate(-2%, 2%)' },
        },
        "shake": {
          "0%, 100%": { transform: 'translateX(0)' },
          "10%, 30%, 50%": { transform: 'translateX(-6px)' },
          "20%, 40%": { transform: 'translateX(6px)' },
        },
        "fade-in-up": {
          "0%": { opacity: '0', transform: 'translateY(20px)' },
          "100%": { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "stat-glow-pulse": "stat-glow-pulse 2s ease-in-out infinite",
        "drift": "drift 15s ease-in-out infinite alternate",
        "drift-reverse": "drift-reverse 15s ease-in-out infinite alternate",
        "shake": "shake 0.4s ease",
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
