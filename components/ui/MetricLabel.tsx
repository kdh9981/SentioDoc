'use client';

import { InfoTooltip } from './Tooltip';
import { getMetricDefinition } from '@/lib/metric-definitions';

interface MetricLabelProps {
  label: string;
  metricKey: string;
  className?: string;
  showInfo?: boolean;
  infoPosition?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Metric label with info icon at END
 */
export function MetricLabel({
  label,
  metricKey,
  className = '',
  showInfo = true,
  infoPosition = 'top'
}: MetricLabelProps) {
  const definition = getMetricDefinition(metricKey);

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span>{label}</span>
      {showInfo && <InfoTooltip content={definition} position={infoPosition} />}
    </span>
  );
}

/**
 * Chart title with icon, title, then info tooltip at END
 */
interface ChartTitleProps {
  icon: string;
  title: string;
  metricKey: string;
  rightContent?: React.ReactNode;
}

export function ChartTitle({ icon, title, metricKey, rightContent }: ChartTitleProps) {
  const definition = getMetricDefinition(metricKey);

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="font-semibold text-slate-800 text-sm tracking-wide">{title}</span>
        <InfoTooltip content={definition} position="top" />
      </div>
      {rightContent}
    </div>
  );
}

export default MetricLabel;
