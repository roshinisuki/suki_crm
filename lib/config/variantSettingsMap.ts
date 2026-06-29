// STRICT variant-to-settings map
// Each variant shows ONLY the items listed here — nothing more, nothing less
// This is the single source of truth for settings sidebar navigation
// NOTE: Users & Roles & Permissions are handled separately via userManagementSubItems
//       and are NOT listed here. This map covers only the Settings expandable section.

export type SettingsItem = {
  key: string;
  label: string;
  href: string;
};

export const VARIANT_SETTINGS_MAP: Record<number, SettingsItem[]> = {

  // V1 — Starter CRM
  1: [
    { key: 'lead-sources',    label: 'Lead Sources',    href: '/settings/lead-sources' },
    { key: 'email-templates', label: 'Email Templates', href: '/settings/email-templates' },
  ],

  // V2 — Professional CRM
  2: [
    { key: 'lead-sources',       label: 'Lead Sources',       href: '/settings/lead-sources' },
    { key: 'pipeline-stages',    label: 'Pipeline Stages',    href: '/settings/pipeline-stages' },
    { key: 'notification-rules', label: 'Notification Rules', href: '/settings/notification-rules' },
    { key: 'email-templates',    label: 'Email Templates',    href: '/settings/email-templates' },
    { key: 'whatsapp-templates', label: 'WhatsApp Templates', href: '/settings/whatsapp-templates' },
    { key: 'product-categories', label: 'Product Categories', href: '/settings/product-categories' },
  ],

  // V3 — Advanced CRM
  3: [
    { key: 'lead-sources',       label: 'Lead Sources',       href: '/settings/lead-sources' },
    { key: 'pipeline-stages',    label: 'Pipeline Stages',    href: '/settings/pipeline-stages' },
    { key: 'approval-matrix',    label: 'Approval Matrix',    href: '/settings/approval-matrix' },
    { key: 'notification-rules', label: 'Notification Rules', href: '/settings/notification-rules' },
    { key: 'email-templates',    label: 'Email Templates',    href: '/settings/email-templates' },
    { key: 'whatsapp-templates', label: 'WhatsApp Templates', href: '/settings/whatsapp-templates' },
    { key: 'product-categories', label: 'Product Categories', href: '/settings/product-categories' },
    { key: 'loss-reason-master', label: 'Loss Reason Master', href: '/settings/loss-reason-master' },
    { key: 'custom-fields',      label: 'Custom Fields',      href: '/settings/custom-fields' },
  ],

  // V4 — Enterprise CRM
  4: [
    { key: 'lead-sources',       label: 'Lead Sources',       href: '/settings/lead-sources' },
    { key: 'pipeline-stages',    label: 'Pipeline Stages',    href: '/settings/pipeline-stages' },
    { key: 'approval-matrix',    label: 'Approval Matrix',    href: '/settings/approval-matrix' },
    { key: 'notification-rules', label: 'Notification Rules', href: '/settings/notification-rules' },
    { key: 'email-templates',    label: 'Email Templates',    href: '/settings/email-templates' },
    { key: 'whatsapp-templates', label: 'WhatsApp Templates', href: '/settings/whatsapp-templates' },
    { key: 'competitor-master',  label: 'Competitor Master',  href: '/settings/competitor-master' },
    { key: 'product-categories', label: 'Product Categories', href: '/settings/product-categories' },
    { key: 'loss-reason-master', label: 'Loss Reason Master', href: '/settings/loss-reason-master' },
    { key: 'territories',        label: 'Territories',        href: '/settings/territories' },
    { key: 'custom-fields',      label: 'Custom Fields',      href: '/settings/custom-fields' },
  ],
};

// Helper — get settings items for a given variant number
// Falls back to V1 if variant is unknown
export function getSettingsForVariant(variant: number): SettingsItem[] {
  return VARIANT_SETTINGS_MAP[variant] ?? VARIANT_SETTINGS_MAP[1];
}

// Items that must NEVER appear in any variant's settings navigation
export const BLOCKED_SETTINGS_KEYS = [
  'customer-portal',
  'portal-activation',
  'portal-users',
  'portal-user-types',
  'portal-settings',
  'portal',
  'tax-master',
  'document-types',
  'sample-configuration',
];
