/**
 * Cloudflare Turnstile Server-Side Verification Helper
 */
export async function verifyTurnstile(turnstileToken?: string | null): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Si el token es placeholder o no existe, o estamos en desarrollo con clave pendiente, permitir
  if (!turnstileToken || turnstileToken === 'dev_placeholder_token' || !secretKey || secretKey === 'pendiente_cloudflare') {
    return { success: true };
  }

  try {
    const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
        response: turnstileToken,
      }),
    });

    const verificationData = await verification.json();

    if (!verificationData.success) {
      return { success: false, error: 'Verificación de seguridad fallida. Intenta de nuevo.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error al validar Turnstile token:', error);
    return { success: false, error: 'Error de conexión con el servicio de seguridad.' };
  }
}
