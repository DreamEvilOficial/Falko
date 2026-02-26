export function calculateDiscountPercentage(originalPrice: number, finalPrice: number): number {
  if (!originalPrice || originalPrice <= 0) return 0
  if (finalPrice < 0) return 0
  if (originalPrice <= finalPrice) return 0
  
  const discount = ((originalPrice - finalPrice) / originalPrice) * 100
  return Number(discount.toFixed(2))
}

export function validatePrices(originalPrice: number, finalPrice: number): { valid: boolean; error?: string } {
  if (finalPrice < 0) return { valid: false, error: 'El precio final no puede ser negativo' }
  if (originalPrice < 0) return { valid: false, error: 'El precio original no puede ser negativo' }
  if (originalPrice > 0 && finalPrice >= originalPrice) {
    return { valid: false, error: 'El precio original debe ser mayor al precio final para aplicar descuento' }
  }
  return { valid: true }
}
