/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/components/common/Button.tsx
 * Purpose: Accessible, touch-friendly button component supporting primary accent, secondary,
 *          ghost, and danger variants.
 */

import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.btn,
    styles[variant],
    size !== 'md' ? styles[size] : '',
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={rest.type || 'button'}
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? 'Processing...' : children}
    </button>
  );
}
