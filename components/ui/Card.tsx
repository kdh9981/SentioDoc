'use client';

import { ReactNode } from 'react';
import Tooltip from './Tooltip';
import { TOOLTIPS, TooltipKey } from '@/lib/tooltips';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`
      bg-white rounded-xl border border-gray-200 shadow-sm
      ${paddingClasses[padding]}
      ${hover ? 'hover:shadow-md hover:border-gray-300 transition-all cursor-pointer' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

// Card with header
interface CardWithHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function CardWithHeader({
  title,
  subtitle,
  action,
  children,
  className = ''
}: CardWithHeaderProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

// Stat Card variant
interface StatCardProps {
  label: string;
  value: string | number;
  change?: { value: number; positive: boolean };
  icon?: string;
  tooltipKey?: TooltipKey;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  icon,
  tooltipKey,
  className = ''
}: StatCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-sm text-gray-500">{label}</p>
            {tooltipKey && <Tooltip content={TOOLTIPS[tooltipKey]} />}
          </div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {change && (
            <p className={`text-xs mt-1 flex items-center gap-0.5 ${change.positive ? 'text-green-600' : 'text-red-600'}`}>
              <span className="material-symbols-outlined text-sm">
                {change.positive ? 'trending_up' : 'trending_down'}
              </span>
              {Math.abs(change.value)}% vs last week
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-blue-50 rounded-lg">
            <span className="material-symbols-outlined text-blue-500">{icon}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

// Metric Card for dashboard overview
interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: string;
  iconBgColor?: string;
  iconColor?: string;
  tooltipKey?: TooltipKey;
  trend?: {
    value: number;
    label?: string;
  };
}

export function MetricCard({
  label,
  value,
  subValue,
  icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  tooltipKey,
  trend
}: MetricCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        {icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgColor}`}>
            <span className={`material-symbols-outlined text-2xl ${iconColor}`}>{icon}</span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm text-slate-500">{label}</p>
            {tooltipKey && <Tooltip content={TOOLTIPS[tooltipKey]} />}
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            {subValue && <span className="text-sm text-slate-500">{subValue}</span>}
          </div>
          {trend && (
            <p className={`text-xs mt-1 ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value >= 0 ? '+' : ''}{trend.value}%{trend.label ? ` ${trend.label}` : ''}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

// Info Card with gradient background
interface InfoCardProps {
  title: string;
  description: string;
  icon?: string;
  gradient?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  action?: ReactNode;
}

export function InfoCard({
  title,
  description,
  icon,
  gradient = 'blue',
  action
}: InfoCardProps) {
  const gradientClasses = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-green-500 to-emerald-600',
    orange: 'from-orange-500 to-amber-600',
    purple: 'from-purple-500 to-violet-600',
    red: 'from-red-500 to-rose-600'
  };

  return (
    <div className={`bg-gradient-to-br ${gradientClasses[gradient]} rounded-xl p-6 text-white`}>
      <div className="flex items-start gap-4">
        {icon && (
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined">{icon}</span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm opacity-90">{description}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </div>
  );
}
