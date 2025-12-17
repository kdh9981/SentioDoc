/**
 * Analytics Library Index
 * Central export point for all analytics utilities
 */

// Core calculations and utilities
export * from './calculations';
export * from './return-rate';

// Unified Insights Engine
export {
  generateUnifiedInsights,
  calculateInsightsSummary,
  MAX_INSIGHTS_VISIBLE,
  MAX_INSIGHTS_TOTAL,
  type Insight,
  type InsightsSummary,
  type Priority,
  type SectionType,
  type HotLeadInfo,
  type CompanyInfo,
  type ContactSummary,
} from './unified-insights';

// Unified Actions Engine
export {
  generateUnifiedActions,
  MAX_ACTIONS_VISIBLE,
  MAX_ACTIONS_TOTAL,
  ACTION_RULES,
  type UnifiedAction,
  type ActionButton,
  type ActionRule,
  type ActionSectionType,
} from './unified-actions';
