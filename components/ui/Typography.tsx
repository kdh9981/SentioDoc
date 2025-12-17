'use client';

import React from 'react';

/**
 * Typography Components - Google Drive Style
 * Use these for consistent typography across the app
 *
 * Typography System:
 * | Class              | Size | Weight | Use For                    |
 * |--------------------|------|--------|----------------------------|
 * | text-page-title    | 24px | Medium | Page headers               |
 * | text-section-header| 20px | Medium | Major sections             |
 * | text-card-title    | 14px | Medium | Card headers               |
 * | text-body          | 14px | Regular| Main content               |
 * | text-nav           | 13px | Regular| Navigation                 |
 * | text-meta          | 12px | Regular| Metadata, secondary        |
 * | text-caption       | 11px | Regular| Smallest text              |
 * | text-stat          | 28px | Bold   | Key numbers                |
 * | text-button        | 14px | Medium | Button text                |
 * | text-link          | 13px | Regular| Links                      |
 */

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

// Page Title - 24px Medium
export function PageTitle({ children, className = '', as: Component = 'h1' }: TypographyProps) {
  return <Component className={`text-page-title ${className}`}>{children}</Component>;
}

// Section Header - 20px Medium
export function SectionHeader({ children, className = '', as: Component = 'h2' }: TypographyProps) {
  return <Component className={`text-section-header ${className}`}>{children}</Component>;
}

// Card Title - 14px Medium
export function CardTitle({ children, className = '', as: Component = 'h3' }: TypographyProps) {
  return <Component className={`text-card-title ${className}`}>{children}</Component>;
}

// Body Text - 14px Regular
export function Body({ children, className = '', as: Component = 'p' }: TypographyProps) {
  return <Component className={`text-body ${className}`}>{children}</Component>;
}

// Navigation Text - 13px Regular
export function Nav({ children, className = '', as: Component = 'span' }: TypographyProps) {
  return <Component className={`text-nav ${className}`}>{children}</Component>;
}

// Meta Text - 12px Regular
export function Meta({ children, className = '', as: Component = 'span' }: TypographyProps) {
  return <Component className={`text-meta ${className}`}>{children}</Component>;
}

// Caption - 11px Regular
export function Caption({ children, className = '', as: Component = 'span' }: TypographyProps) {
  return <Component className={`text-caption ${className}`}>{children}</Component>;
}

// Stat Number - 28px Bold
export function Stat({ children, className = '', as: Component = 'span' }: TypographyProps) {
  return <Component className={`text-stat ${className}`}>{children}</Component>;
}

// Stat Number Large - 32px Bold
export function StatLarge({ children, className = '', as: Component = 'span' }: TypographyProps) {
  return <Component className={`text-stat-lg ${className}`}>{children}</Component>;
}

// Button Text - 14px Medium
export function ButtonText({ children, className = '', as: Component = 'span' }: TypographyProps) {
  return <Component className={`text-button ${className}`}>{children}</Component>;
}

// Link Text - 13px Regular
export function LinkText({ children, className = '', as: Component = 'span' }: TypographyProps) {
  return <Component className={`text-link ${className}`}>{children}</Component>;
}

// Footer Header - 13px Medium
export function FooterHeader({ children, className = '', as: Component = 'h4' }: TypographyProps) {
  return <Component className={`text-footer-header ${className}`}>{children}</Component>;
}

// Footer Link - 12px Regular
export function FooterLink({ children, className = '', as: Component = 'span' }: TypographyProps) {
  return <Component className={`text-footer-link ${className}`}>{children}</Component>;
}

export default {
  PageTitle,
  SectionHeader,
  CardTitle,
  Body,
  Nav,
  Meta,
  Caption,
  Stat,
  StatLarge,
  ButtonText,
  LinkText,
  FooterHeader,
  FooterLink,
};
