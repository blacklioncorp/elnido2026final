export function getMagicLinkTemplate(magicLinkUrl: string): string {
  return `
<div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; background: #F7F3E8; border-radius: 16px; overflow: hidden;">
  <!-- Header con gradiente -->
  <div style="background: linear-gradient(135deg, #0B2B26, #1A4A3A); padding: 32px; text-align: center;">
    <img src="https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/icon-logos/LOGO-ELNIDO-blanco.webp" width="80" alt="El Nido Logo" />
    <h1 style="color: #D4A843; font-size: 20px; margin-top: 16px;">Gestiona tu donación</h1>
  </div>
  
  <!-- Body -->
  <div style="padding: 32px;">
    <p style="color: #0B2B26; font-size: 16px;">Hola 👋</p>
    <p style="color: #0B2B26; font-size: 14px; line-height: 1.5;">Recibimos tu solicitud para gestionar tus donaciones recurrentes.</p>
    <p style="color: #0B2B26; font-size: 14px; line-height: 1.5;">Haz clic en el botón de abajo para acceder a tu panel de donaciones. <strong>Este enlace expira en 30 minutos.</strong></p>
    
    <div style="text-align: center; margin: 32px 0;">
      <!-- Botón -->
      <a href="${magicLinkUrl}" style="display: inline-block; background: #D4A843; color: #0B2B26; padding: 14px 28px; border-radius: 32px; text-decoration: none; font-weight: 600;">Gestionar mis donaciones</a>
    </div>
    
    <p style="color: #666; font-size: 12px; margin-top: 32px; line-height: 1.5;">Si no solicitaste este enlace, ignora este email. Tus donaciones seguirán activas y seguras.</p>
  </div>
  
  <!-- Footer -->
  <div style="background: #0B2B26; padding: 16px; text-align: center;">
    <p style="color: #D4A843; font-size: 12px; margin: 0;">🦜 El Nido — Santuario de Fauna Mexicana</p>
  </div>
</div>
  `
}
