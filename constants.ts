import { Country, WebsiteProfile } from './types';

export const COUNTRIES: Country[] = [
  { code: 'WW', name: 'Worldwide' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BR', name: 'Brazil' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
];

export const DEFAULT_WEBSITES: WebsiteProfile[] = [
  {
    id: 'zizme',
    name: 'zizme.com',
    description: 'Tech Reviews & Tool Recommendations (The Authority)',
    tone: 'Expert, Critical, Direct',
    hasDynamicCategories: true
  },
  {
    id: 'eallinfo',
    name: 'eallinfo.com',
    description: 'Bangladesh Info Portal (Education, Jobs, SIM, Apps)',
    tone: 'Informative, Reliable, Helpful',
    hasDynamicCategories: true
  },
  {
    id: 'xacot',
    name: 'xacot.com',
    description: 'Educational Guides & Manuals (The Bridge)',
    tone: 'Helpful, Teacher-like, Empathetic',
    hasDynamicCategories: true
  },
  {
    id: 'upanel',
    name: 'Upanel',
    description: 'Multi-topic Blog & News Portal (The Hub)',
    tone: 'Professional, Engaging, Authoritative',
    hasDynamicCategories: true
  }
];