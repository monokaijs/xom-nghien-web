function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export const INVENTORY_PUBLIC_URL = trimTrailingSlash(
  process.env.INVENTORY_PUBLIC_URL ||
    process.env.INVENTORY_SERVICE_URL ||
    'https://inventory.xomnghien.com'
);

export const INVENTORY_INTERNAL_URL = trimTrailingSlash(
  process.env.INVENTORY_INTERNAL_URL || INVENTORY_PUBLIC_URL
);

export const INVENTORY_SERVICE_URL = INVENTORY_PUBLIC_URL;
export const XN_INV_API_AUTH_KEY = process.env.XN_INV_API_AUTH_KEY;
