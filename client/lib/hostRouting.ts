export const PORTAL_ALIASES = [
  "admin",
  "super-admin",
  "support",
  "affiliate",
  "funding-manager",
  "member",
] as const;

export type PortalAlias = (typeof PORTAL_ALIASES)[number];

type NonAdminPortalAlias = Exclude<PortalAlias, "admin">;

interface RedirectInput {
  hostname: string;
  pathname: string;
  protocol: string;
  port: string;
  search?: string;
  hash?: string;
}

export interface PortalRedirectResult {
  type: "host" | "path";
  targetAlias?: PortalAlias;
  targetPath?: string;
  targetUrl?: string;
}

const NON_ADMIN_PORTAL_PREFIXES: Record<NonAdminPortalAlias, string> = {
  "super-admin": "/super-admin",
  support: "/support",
  affiliate: "/affiliate",
  "funding-manager": "/funding-manager",
  member: "/member",
};

const PORTAL_DEFAULT_PATHS: Record<PortalAlias, string> = {
  admin: "/dashboard",
  "super-admin": "/dashboard",
  support: "/dashboard",
  affiliate: "/dashboard",
  "funding-manager": "/dashboard",
  member: "/dashboard",
};

const ADMIN_CANONICAL_PATHS = [
  /^\/login$/,
  /^\/register$/,
  /^\/dashboard$/,
  /^\/clients(?:\/[^/]+)?$/,
  /^\/employees$/,
  /^\/reports$/,
  /^\/credit-report(?:\/[^/]+)?$/,
  /^\/funding\/diy(?:\/[^/]+)?$/,
  /^\/funding\/apply\/[^/]+$/,
  /^\/credit-reports\/scraper(?:-logs)?$/,
  /^\/disputes$/,
  /^\/ai-coach$/,
  /^\/school$/,
  /^\/course\/[^/]+$/,
  /^\/analytics$/,
  /^\/affiliate$/,
  /^\/affiliate-management$/,
  /^\/compliance$/,
  /^\/automation$/,
  /^\/settings$/,
  /^\/admin\/feature-requests$/,
  /^\/support$/,
  /^\/subscription$/,
  /^\/billing\/(success|cancel)$/,
  /^\/debug-permissions$/,
  /^\/invoices$/,
  /^\/client-intake(?:\/[^/]+)?$/,
  /^\/invoice\/[^/]+$/,
  /^\/payslip\/[^/]+$/,
] as const;

function normalizePath(pathname: string) {
  if (!pathname) {
    return "/";
  }

  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function getBaseDomain(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized.endsWith(".localhost")
  ) {
    return normalized === "127.0.0.1" ? "127.0.0.1" : "localhost";
  }

  const parts = normalized.replace(/^www\./, "").split(".");
  if (parts.length <= 2) {
    return parts.join(".");
  }

  return parts.slice(-2).join(".");
}

function getAliasHost(alias: PortalAlias, hostname: string) {
  const baseDomain = getBaseDomain(hostname);
  if (baseDomain === "127.0.0.1") {
    return hostname;
  }

  return `${alias}.${baseDomain}`;
}

function isPortalAlias(value: string): value is PortalAlias {
  return PORTAL_ALIASES.includes(value as PortalAlias);
}

function stripPortalPrefix(prefix: string, pathname: string, alias: PortalAlias) {
  if (pathname === prefix) {
    return PORTAL_DEFAULT_PATHS[alias];
  }

  if (!pathname.startsWith(`${prefix}/`)) {
    return null;
  }

  const stripped = pathname.slice(prefix.length);
  return stripped.length > 0 ? stripped : PORTAL_DEFAULT_PATHS[alias];
}

export function getHostAlias(hostname: string): PortalAlias | null {
  const normalized = hostname.toLowerCase();
  const withoutPort = normalized.split(":")[0];

  if (!withoutPort.endsWith(".localhost")) {
    return null;
  }

  const subdomain = withoutPort.slice(0, -".localhost".length);
  return isPortalAlias(subdomain) ? subdomain : null;
}

export function buildAliasUrl(
  alias: PortalAlias,
  pathname: string,
  options?: Pick<RedirectInput, "protocol" | "port" | "hostname" | "search" | "hash">,
) {
  const protocol = options?.protocol ?? (typeof window !== "undefined" ? window.location.protocol : "http:");
  const hostname = options?.hostname ?? (typeof window !== "undefined" ? window.location.hostname : "localhost");
  const port = options?.port ?? (typeof window !== "undefined" ? window.location.port : "3001");
  const search = options?.search ?? "";
  const hash = options?.hash ?? "";
  const portSegment = port ? `:${port}` : "";

  return `${protocol}//${getAliasHost(alias, hostname)}${portSegment}${normalizePath(pathname)}${search}${hash}`;
}

export function isAdminCanonicalPath(pathname: string) {
  const normalized = normalizePath(pathname);
  return ADMIN_CANONICAL_PATHS.some((pattern) => pattern.test(normalized));
}

export function getPortalDefaultPath(alias: PortalAlias) {
  return PORTAL_DEFAULT_PATHS[alias];
}

export function getPortalAliasForRole(role?: string | null): PortalAlias | null {
  switch (role) {
    case "admin":
      return "admin";
    case "super_admin":
      return "super-admin";
    case "support":
      return "support";
    case "affiliate":
      return "affiliate";
    case "funding_manager":
      return "funding-manager";
    case "client":
      return "member";
    default:
      return null;
  }
}

export function getPortalNavigationTarget(alias: PortalAlias, pathname: string) {
  const normalizedPath = normalizePath(pathname);
  const currentAlias = typeof window !== "undefined" ? getHostAlias(window.location.hostname) : null;

  if (currentAlias === alias) {
    return {
      external: false,
      target: normalizedPath,
    };
  }

  return {
    external: true,
    target: buildAliasUrl(alias, normalizedPath),
  };
}

export function getPortalSidebarPath(href: string, alias: NonAdminPortalAlias) {
  const prefix = NON_ADMIN_PORTAL_PREFIXES[alias];
  const normalized = normalizePath(href);
  const stripped = stripPortalPrefix(prefix, normalized, alias);

  if (!stripped) {
    return normalized;
  }

  if (alias === "super-admin" && stripped === "/overview") {
    return "/dashboard";
  }

  return stripped;
}

export function isPortalSidebarActive(currentPath: string, href: string, alias: NonAdminPortalAlias) {
  const normalizedCurrent = getPortalSidebarPath(currentPath, alias);
  const normalizedHref = getPortalSidebarPath(href, alias);
  return normalizedCurrent === normalizedHref;
}

export function getLegacyPortalTarget(
  pathname: string,
  options?: { allowExactSupportAffiliate?: boolean },
): { alias: NonAdminPortalAlias; cleanPath: string } | null {
  const normalized = normalizePath(pathname);

  for (const [alias, prefix] of Object.entries(NON_ADMIN_PORTAL_PREFIXES) as Array<[
    NonAdminPortalAlias,
    string,
  ]>) {
    if ((alias === "support" || alias === "affiliate") && normalized === prefix && !options?.allowExactSupportAffiliate) {
      continue;
    }

    const cleanPath = stripPortalPrefix(prefix, normalized, alias);
    if (cleanPath) {
      return { alias, cleanPath };
    }
  }

  return null;
}

export function getCanonicalPortalRedirect(input: RedirectInput): PortalRedirectResult | null {
  const pathname = normalizePath(input.pathname);
  const currentAlias = getHostAlias(input.hostname);
  const prefixedPortalTarget = getLegacyPortalTarget(pathname, {
    allowExactSupportAffiliate: currentAlias === "support" || currentAlias === "affiliate",
  });

  if (currentAlias) {
    if (prefixedPortalTarget) {
      if (prefixedPortalTarget.alias === currentAlias) {
        if (prefixedPortalTarget.cleanPath !== pathname) {
          return {
            type: "path",
            targetPath: prefixedPortalTarget.cleanPath,
          };
        }

        return null;
      }

      return {
        type: "host",
        targetAlias: prefixedPortalTarget.alias,
        targetUrl: buildAliasUrl(prefixedPortalTarget.alias, prefixedPortalTarget.cleanPath, input),
      };
    }

    if (pathname === "/") {
      return {
        type: "path",
        targetPath: PORTAL_DEFAULT_PATHS[currentAlias],
      };
    }

    return null;
  }

  if (prefixedPortalTarget) {
    return {
      type: "host",
      targetAlias: prefixedPortalTarget.alias,
      targetUrl: buildAliasUrl(prefixedPortalTarget.alias, prefixedPortalTarget.cleanPath, input),
    };
  }

  if (isAdminCanonicalPath(pathname)) {
    return {
      type: "host",
      targetAlias: "admin",
      targetUrl: buildAliasUrl("admin", pathname, input),
    };
  }

  return null;
}