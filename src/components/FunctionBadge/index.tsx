import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export type BadgeVariant = 'runtime' | 'trigger' | 'limit' | 'info';

export interface FunctionBadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: string;
}

const VARIANT_LABELS: Record<BadgeVariant, string> = {
  runtime: 'Runtime',
  trigger: 'Trigger',
  limit: 'Limit',
  info: 'Info',
};

export function FunctionBadge({
  label,
  variant = 'info',
  icon,
}: FunctionBadgeProps): React.JSX.Element {
  const ariaLabel = `${VARIANT_LABELS[variant]}: ${label}`;

  return (
    <span
      className={clsx(styles.badge, styles[variant])}
      aria-label={ariaLabel}
      role="status"
    >
      {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      <span className={styles.label}>{label}</span>
    </span>
  );
}

export function getVariantLabel(variant: BadgeVariant): string {
  return VARIANT_LABELS[variant];
}

export default FunctionBadge;
