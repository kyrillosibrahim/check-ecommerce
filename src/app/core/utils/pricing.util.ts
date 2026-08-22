/**
 * Uses the admin's exact discounted price because discountPercentage is a rounded integer and re-deriving from it loses precision.
 */
export function unitPriceAfterDiscount(p: { price: number; discountPercentage?: number; discountedPrice?: number }): number {
  const price = p.price || 0;
  const discountedPrice = p.discountedPrice;
  if (typeof discountedPrice === 'number' && Number.isFinite(discountedPrice) && discountedPrice > 0 && discountedPrice < price) {
    return discountedPrice;
  }
  return price * (1 - (p.discountPercentage || 0) / 100);
}
