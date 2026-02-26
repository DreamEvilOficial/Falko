
// Service for Correo Argentino (Paq.ar) integration
// Documentation: https://api.correoargentino.com.ar/paqar/v1/

export interface PaqarLabelData {
  sender: {
    nombre: string
    calle: string
    numero: string
    localidad: string
    provincia: string
    cp: string
    telefono?: string
    email?: string
  }
  receiver: {
    nombre: string
    dni?: string
    email: string
    telefono?: string
    calle: string
    numero: string
    localidad: string
    provincia: string
    cp: string
  }
  package: {
    peso: number // kg
    largo: number // cm
    ancho: number // cm
    alto: number // cm
    valorDeclarado: number
    contenido?: string
  }
  trackingNumber: string
  labelUrl?: string // URL to PDF if available
  productType: 'CP' | 'EP' // CP: Clásica, EP: Expreso, etc.
}

const MOCK_DELAY = 1500

export const paqarService = {
  // Default Config
  config: {
    baseUrl: process.env.PAQAR_API_URL || 'https://api.correoargentino.com.ar/paqar/v1',
    apiKey: process.env.PAQAR_API_KEY,
    secret: process.env.PAQAR_SECRET
  },

  // Authenticate
  async authenticate(config: any): Promise<string> {
    if (!config.apiKey) {
      console.warn('Paq.ar: Missing API Key - Using Mock Authentication (Fallback)')
      return 'mock-token'
    }

    try {
      const res = await fetch(`${config.baseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: config.apiKey,
          secret: config.secret
        })
      })
      
      if (!res.ok) {
          const errText = await res.text()
          throw new Error(`Paq.ar Auth Failed: ${res.status} ${errText}`)
      }
      const data = await res.json()
      return data.token
    } catch (error) {
      console.error('Paq.ar Auth Error:', error)
      throw error
    }
  },

  // Create Shipment (Imposicion)
  async createShipment(order: any, senderOverride?: any, configOverride?: any): Promise<PaqarLabelData> {
    // Merge config
    const config = { ...this.config, ...configOverride }
    
    const token = await this.authenticate(config)

    // Determine sender data (override or default)
    const sender = senderOverride || {
      nombre: 'Urban CDG Official',
      calle: 'Av. Corrientes',
      numero: '1234',
      localidad: 'CABA',
      provincia: 'CABA',
      cp: '1000',
      email: 'contacto@urbancdg.com',
      telefono: '11-1234-5678'
    }

    // Parse address
    const addressParts = (order.direccion_envio || '').split(' ')
    const number = addressParts.length > 1 ? addressParts.pop() : 'S/N'
    const street = addressParts.join(' ') || order.direccion_envio || 'Calle Principal'

    // Extract DNI from notes if available
    let dni = 'N/A'
    if (order.notas) {
        const dniMatch = order.notas.match(/DNI:\s*(\d+)/i)
        if (dniMatch) dni = dniMatch[1]
    }

    const shipmentData: PaqarLabelData = {
      sender,
      receiver: {
        nombre: order.cliente_nombre || 'Cliente',
        dni: dni,
        email: order.cliente_email,
        telefono: order.cliente_telefono,
        calle: street,
        numero: number,
        localidad: order.ciudad || order.envio_ciudad || 'Ciudad',
        provincia: order.provincia || order.envio_provincia || 'Provincia',
        cp: order.codigo_postal || order.envio_codigo_postal || '0000'
      },
      package: {
        peso: 1.0, // Default 1kg
        largo: 40,
        ancho: 30,
        alto: 10,
        valorDeclarado: order.total || 0,
        contenido: 'Indumentaria'
      },
      trackingNumber: '', // Filled later
      productType: 'CP'
    }

    if (token === 'mock-token') {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY))
      return {
        ...shipmentData,
        trackingNumber: `CP${Math.floor(Math.random() * 1000000000)}AR`
      }
    }

    // Real API Call
    try {
      const res = await fetch(`${config.baseUrl}/imposicion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(shipmentData)
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Paq.ar Create Shipment Failed: ${res.status} ${errText}`)
      }
      const data = await res.json()
      
      return {
        ...shipmentData,
        trackingNumber: data.trackingNumber || data.numero,
        labelUrl: data.labelUrl || data.etiqueta
      }
    } catch (error) {
      console.error('Paq.ar Create Shipment Error:', error)
      throw error
    }
  },

  // Helper to generate the Label HTML for printing (Client-side use mostly)
  generateLabelHtml(data: PaqarLabelData): string {
    return `
      <html>
        <head>
          <title>Etiqueta Paq.ar - ${data.trackingNumber}</title>
          <style>
            @page { size: A4; margin: 0; }
            body { font-family: 'Arial', sans-serif; padding: 20px; margin: 0; background: #fff; color: #000; }
            .label-page { 
              width: 100%; 
              max-width: 800px;
              border: 4px solid #000; 
              margin: 0 auto; 
              padding: 20px;
              box-sizing: border-box;
              position: relative;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 3px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .logo { font-weight: 900; font-size: 32px; font-style: italic; color: #004b8d; text-transform: uppercase; }
            .service-type { font-size: 48px; font-weight: 900; border: 3px solid #000; padding: 5px 20px; border-radius: 8px; }
            
            .section { margin-bottom: 20px; border: 2px solid #000; border-radius: 8px; overflow: hidden; }
            .section-header { 
                background: #000; 
                color: #fff; 
                padding: 8px 15px; 
                font-weight: bold; 
                text-transform: uppercase; 
                font-size: 16px;
                display: flex;
                justify-content: space-between;
            }
            .section-content { padding: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .field { margin-bottom: 5px; }
            .label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #555; margin-bottom: 2px; }
            .value { font-size: 14px; font-weight: bold; word-break: break-word; }
            .full-width { grid-column: span 2; }
            
            .barcode-area { 
              text-align: center; 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 2px dashed #000; 
            }
            .tracking-number { font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin-top: 10px; }
            
            .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="label-page">
            <div class="header">
              <div class="logo">Correo Argentino</div>
              <div class="service-type">${data.productType}</div>
            </div>

            <!-- DESTINATARIO -->
            <div class="section">
              <div class="section-header">
                <span>Destinatario</span>
                <span>DEST</span>
              </div>
              <div class="section-content">
                <div class="field full-width">
                  <div class="label">Nombre Completo</div>
                  <div class="value" style="font-size: 18px;">${data.receiver.nombre}</div>
                </div>
                <div class="field">
                  <div class="label">DNI</div>
                  <div class="value">${data.receiver.dni || 'N/A'}</div>
                </div>
                 <div class="field">
                  <div class="label">Teléfono</div>
                  <div class="value">${data.receiver.telefono || 'N/A'}</div>
                </div>
                <div class="field full-width">
                  <div class="label">Dirección de Entrega</div>
                  <div class="value">${data.receiver.calle} ${data.receiver.numero}</div>
                </div>
                <div class="field">
                  <div class="label">Localidad / Provincia</div>
                  <div class="value">${data.receiver.localidad}, ${data.receiver.provincia}</div>
                </div>
                <div class="field">
                  <div class="label">Código Postal</div>
                  <div class="value" style="font-size: 20px; border: 2px solid #000; display: inline-block; padding: 2px 8px;">${data.receiver.cp}</div>
                </div>
                <div class="field full-width">
                  <div class="label">Email</div>
                  <div class="value">${data.receiver.email}</div>
                </div>
              </div>
            </div>

            <!-- REMITENTE -->
            <div class="section">
              <div class="section-header">
                <span>Remitente</span>
                <span>REM</span>
              </div>
              <div class="section-content">
                <div class="field">
                  <div class="label">Nombre</div>
                  <div class="value">${data.sender.nombre}</div>
                </div>
                <div class="field">
                  <div class="label">Teléfono</div>
                  <div class="value">${data.sender.telefono || 'N/A'}</div>
                </div>
                <div class="field full-width">
                  <div class="label">Dirección</div>
                  <div class="value">${data.sender.calle} ${data.sender.numero}, ${data.sender.localidad}, ${data.sender.provincia} (CP: ${data.sender.cp})</div>
                </div>
                 <div class="field full-width">
                  <div class="label">Email</div>
                  <div class="value">${data.sender.email || 'N/A'}</div>
                </div>
              </div>
            </div>

            <!-- DETALLES DEL PAQUETE -->
            <div class="section">
               <div class="section-header">
                <span>Detalles del Paquete</span>
                <span>PKT</span>
              </div>
              <div class="section-content" style="grid-template-columns: 1fr 1fr 1fr 1fr;">
                <div class="field">
                  <div class="label">Peso (kg)</div>
                  <div class="value">${data.package.peso}</div>
                </div>
                <div class="field">
                  <div class="label">Dimensiones (cm)</div>
                  <div class="value">${data.package.largo}x${data.package.ancho}x${data.package.alto}</div>
                </div>
                <div class="field">
                  <div class="label">Valor Decl.</div>
                  <div class="value">$${data.package.valorDeclarado}</div>
                </div>
                 <div class="field">
                  <div class="label">Contenido</div>
                  <div class="value">${data.package.contenido || 'Varios'}</div>
                </div>
              </div>
            </div>

            <div class="barcode-area">
              <!-- Placeholder for barcode -->
              <div style="height: 80px; background: repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px);"></div>
              <div class="tracking-number">${data.trackingNumber}</div>
            </div>

            <div class="footer">
              Generado por Urban CDG System - ${new Date().toLocaleDateString()}
            </div>
          </div>
          <script>
            window.print();
          </script>
        </body>
      </html>
    `
  }
}
