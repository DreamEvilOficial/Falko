
// Mock service for Andreani integration
// In a real scenario, this would use environment variables for API credentials

export interface AndreaniLabelData {
  sender: {
    name: string
    address: string
    city: string
    zip: string
  }
  receiver: {
    name: string
    dni: string
    address: string
    city: string
    zip: string
    phone?: string
  }
  package: {
    description: string
    weight: number // in kg
    dimensions?: string
  }
  trackingNumber: string
  barcode: string
}

const MOCK_DELAY = 1000

export const andreaniService = {
  // Validate address (Mock)
  async validateAddress(address: string, zip: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY))
    // Mock logic: valid if zip is 4 digits
    return /^\d{4}$/.test(zip)
  },

  // Generate Label (Mock)
  async generateLabel(data: any): Promise<AndreaniLabelData> {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY))
    
    // Generate a mock tracking number and barcode
    const trackingNumber = `AND-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    const barcode = `779${Math.floor(Math.random() * 10000000000)}`

    return {
      sender: {
        name: 'Urban CDG',
        address: 'Av. Corrientes 1234', // Example store address
        city: 'CABA',
        zip: '1000'
      },
      receiver: {
        name: data.cliente_nombre || 'Cliente Anónimo',
        dni: data.metadata?.dni || 'N/A', // Assuming DNI might be in metadata or we ask for it
        address: data.direccion_envio || 'Dirección desconocida',
        city: data.ciudad || 'Ciudad desconocida',
        zip: data.codigo_postal || '0000',
        phone: data.cliente_telefono
      },
      package: {
        description: 'Indumentaria - Urban CDG',
        weight: 1.5 // Default weight
      },
      trackingNumber,
      barcode
    }
  },

  // Mock PDF generation URL (In real app, this would be a blob or a link to Andreani PDF)
  getLabelPdfUrl(trackingNumber: string): string {
    return `/api/shipping/label/${trackingNumber}.pdf`
  }
}
