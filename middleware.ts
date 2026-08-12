import { proxy } from './src/proxy'

export const middleware = proxy

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
