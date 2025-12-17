'use client';

import { InfoTooltip } from './Tooltip';
import { getMetricDefinition } from '@/lib/metric-definitions';

interface SectionTitleProps {
  icon: string;
  title: string;
  metricKey: string;
  rightContent?: React.ReactNode;
  className?: string;
}

/**
 * Standardized section title with icon and info tooltip
 * Pattern: [Icon] [Title] [ⓘ] [Optional Right Content]
 */
export function SectionTitle({
  icon,
  title,
  metricKey,
  rightContent,
  className = ''
}: SectionTitleProps) {
  const definition = getMetricDefinition(metricKey);

  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="font-semibold text-slate-800 text-sm tracking-wide">{title}</span>
        <InfoTooltip content={definition} position="top" />
      </div>
      {rightContent}
    </div>
  );
}

/**
 * Stat label with info tooltip at end
 * Pattern: [Label] [ⓘ]
 */
interface StatLabelProps {
  label: string;
  metricKey: string;
  className?: string;
}

export function StatLabel({ label, metricKey, className = '' }: StatLabelProps) {
  const definition = getMetricDefinition(metricKey);

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span>{label}</span>
      <InfoTooltip content={definition} position="top" size="sm" />
    </span>
  );
}

export default SectionTitle;
