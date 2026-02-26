export const formatPrice = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '0'
  
  // Use toNumber to handle both numbers and string representations robustly
  // (This handles "5000", "5.000", "5000.00", etc. correctly)
  const numberValue = toNumber(value)

  if (isNaN(numberValue)) return '0'

  return numberValue.toLocaleString('es-AR', {
    minimumFractionDigits: numberValue % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  })
}

export const toNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  
  const str = String(value).trim()
  if (!str) return 0

  // Si contiene comas, asumimos formato es-AR con decimales (1.234,56)
  if (str.includes(',')) {
    const n = Number(str.replace(/\./g, '').replace(/,/g, '.'))
    return isNaN(n) ? 0 : n
  }
  
  // Cuenta los puntos
  const dotCount = (str.match(/\./g) || []).length

  if (dotCount > 0) {
    // Caso especial: Si tiene puntos pero termina en .XX (dos dígitos), 
    // podría ser un intento de decimales incorrecto (ej: 50.000.00)
    // En es-AR los decimales van con coma. Si el usuario mezcla, intentamos ser inteligentes.
    if (/\.\d{2}$/.test(str)) {
      // Asumimos que el último punto es decimal
      const lastDotIndex = str.lastIndexOf('.')
      const integerPart = str.substring(0, lastDotIndex).replace(/\./g, '')
      const decimalPart = str.substring(lastDotIndex + 1)
      const n = Number(`${integerPart}.${decimalPart}`)
      return isNaN(n) ? 0 : n
    }

    // Regla general: Si tiene puntos y NO son 2 decimales al final:
    // Si termina en 3 dígitos (.000, .500) asumimos SIEMPRE miles.
    // "50.000" -> 50000
    // "1.000.000" -> 1000000
    if (/\.\d{3}$/.test(str) || dotCount > 1) {
      const n = Number(str.replace(/\./g, ''))
      return isNaN(n) ? 0 : n
    }
  }

  // Si no tiene puntos ni comas, o tiene un punto que no parece miles (ej: 50.5)
  // Lo tratamos como número estándar JS
  const n = Number(str)
  return isNaN(n) ? 0 : n
}
