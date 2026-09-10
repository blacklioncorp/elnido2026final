'use client';

import { useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  className?: string;
}

export default function TurnstileCaptcha({ onVerify, onError, className }: TurnstileCaptchaProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const isPlaceholder = !siteKey || siteKey === 'pendiente_cloudflare';

  useEffect(() => {
    if (isPlaceholder) {
      onVerify('dev_placeholder_token');
    }
  }, [isPlaceholder, onVerify]);

  if (isPlaceholder) {
    return (
      <div className={`text-xs text-muted-foreground ${className || ''}`}>
        Protección anti-spam activada próximamente.
      </div>
    );
  }

  return (
    <div className={className}>
      <Turnstile
        siteKey={siteKey}
        onSuccess={onVerify}
        onError={onError}
        onExpire={onError}
      />
    </div>
  );
}
