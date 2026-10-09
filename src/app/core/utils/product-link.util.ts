const PRODUCT_LINK_RE = /\/product\/([^/?#]+)/;

/** Extracts the product id from a storefront link like `/product/prod-abc123` (absolute URLs work too). */
export function productIdFromLink(link?: string): string | undefined {
  return link?.match(PRODUCT_LINK_RE)?.[1];
}
