import QRCode from 'qrcode'

/** Genera un data URL PNG del QR a partir de un token/payload. */
export async function generarQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 512,
    margin: 2,
    color: { dark: '#0B2B26', light: '#FFFFFF' },
  })
}
