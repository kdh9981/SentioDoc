// These slugs are reserved and cannot be used for file links
export const RESERVED_SLUGS = [
  's',  // Reserved for share links route
  'dashboard',
  'auth',
  'api',
  'admin',
  'settings',
  'login',
  'logout',
  'signup',
  'register',
  'signin',
  'signout',
  'account',
  'profile',
  'help',
  'support',
  'about',
  'contact',
  'terms',
  'privacy',
  'pricing',
  'blog',
  'docs',
  'view',
  'v',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  '_next',
  'static',
];

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}
