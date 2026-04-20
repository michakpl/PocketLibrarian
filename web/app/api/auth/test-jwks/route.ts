import { NextResponse } from 'next/server'

/**
 * Serves a static RSA public key as a JWKS endpoint for e2e tests.
 * Only available when NEXT_PUBLIC_E2E=true — returns 404 in production.
 */
export async function GET() {
  if (process.env.NEXT_PUBLIC_E2E !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Public JWK — test-only, no security implications
  const publicJwk = {
    kty: 'RSA',
    use: 'sig',
    alg: 'RS256',
    kid: 'e2e-test-key-1',
    n: 'tyDTmfkb7trGlzokhkt4neoJzJhs4kkPIpSeKNEsrvH17gTpMALJEy6jLhs5-0xDFEI6BeBwaDL8EmVo7bj8jLp62vn9XR1jTosPx_5dOwOLrlUxBXA1zLv5b14ir7t1_vXdkPfRwLD66nHPI_xNCAS69V2BNY47jyqJR8H_smmWqX8irLA1VhDaRcdhOFZcdZXK-RBEbUKWUXUfZy3Zhtyqoysc7d5QXwlQcjqulgbXPF1vHfQZiK55O27k1h48MT4NecxEm02B7gIe8ZTqakUEp1t00QL2fDx5hmtREe4PQTURBxyRr7Dm4oEu51niPXv3olxNsBpsoOoxnXrBAQ',
    e: 'AQAB',
  }

  return NextResponse.json({ keys: [publicJwk] })
}

