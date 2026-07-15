/** True for any admin-console route. Shared by SiteChrome and the page template. */
export function isAdminRoute(pathname: string | null | undefined): boolean {
  return Boolean(pathname?.startsWith("/admin"));
}
