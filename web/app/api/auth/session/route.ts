import {randomUUID} from 'crypto'
import {NextRequest, NextResponse} from 'next/server'
import {createRemoteJWKSet, jwtVerify} from 'jose'
import {createSession, deleteSession, type SessionPayload} from '@/lib/session'

const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_TOKEN_TTL_SECONDS = 3600
const MICROSOFT_JWKS_URL =
    process.env.MICROSOFT_JWKS_URL ?? 'https://login.microsoftonline.com/common/discovery/v2.0/keys'
const MICROSOFT_JWKS = createRemoteJWKSet(new URL(MICROSOFT_JWKS_URL))
type SessionRequestBody = {
    idToken?: string
    accessToken: string
    accessTokenExpiresAt: number
}

function getExpectedOrigin(request: NextRequest) {
    return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
}

function isAllowedOrigin(value: string | null, expectedOrigin: string) {
    if (!value) return false
    try {
        return new URL(value).origin === expectedOrigin
    } catch {
        return false
    }
}

function isSameOriginRequest(request: NextRequest) {
    const expectedOrigin = getExpectedOrigin(request)
    const origin = request.headers.get('origin')
    if (origin) {
        return isAllowedOrigin(origin, expectedOrigin)
    }
    return isAllowedOrigin(request.headers.get('referer'), expectedOrigin)
}

function getCsrfToken(request: NextRequest) {
    return request.cookies.get(CSRF_COOKIE_NAME)?.value
}

function hasValidCsrfToken(request: NextRequest) {
    const cookieToken = getCsrfToken(request)
    const headerToken = request.headers.get('x-csrf-token')
    return !!cookieToken && !!headerToken && cookieToken === headerToken
}

async function verifyMicrosoftIdToken(idToken: string) {
    const audience = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID
    if (!audience) {
        throw new Error('Missing Microsoft client ID configuration')
    }
    const {payload} = await jwtVerify(idToken, MICROSOFT_JWKS, {
        audience,
    })
    const issuer = typeof payload.iss === 'string' ? payload.iss : ''
    if (!issuer.startsWith('https://login.microsoftonline.com/')) {
        throw new Error('Invalid token issuer')
    }
    const userId = typeof payload.sub === 'string' ? payload.sub : undefined
    const name = typeof payload.name === 'string' ? payload.name : undefined
    const emailClaim = typeof payload.email === 'string'
        ? payload.email
        : typeof payload.preferred_username === 'string'
            ? payload.preferred_username
            : undefined
    if (!userId || !name || !emailClaim) {
        throw new Error('Missing required claims')
    }
    return {userId, name, email: emailClaim}
}

export async function GET() {
    const token = randomUUID()
    const response = NextResponse.json({csrfToken: token})
    response.cookies.set(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: CSRF_TOKEN_TTL_SECONDS,
        path: '/',
    })
    return response
}

export async function POST(request: NextRequest) {
    if (!isSameOriginRequest(request)) {
        return NextResponse.json({error: 'Invalid request origin'}, {status: 403})
    }
    if (!hasValidCsrfToken(request)) {
        return NextResponse.json({error: 'Invalid CSRF token'}, {status: 403})
    }
    const body = await request.json() as SessionRequestBody
    if (!body.idToken) {
        return NextResponse.json({error: 'Missing Microsoft ID token'}, {status: 400})
    }
    let verifiedIdentity: Pick<SessionPayload, 'userId' | 'name' | 'email'>
    try {
        verifiedIdentity = await verifyMicrosoftIdToken(body.idToken)
    } catch {
        return NextResponse.json({error: 'Invalid Microsoft ID token'}, {status: 401})
    }
    await createSession({
        sessionId: randomUUID(),
        userId: verifiedIdentity.userId,
        name: verifiedIdentity.name,
        email: verifiedIdentity.email,
        accessToken: body.accessToken,
        accessTokenExpiresAt: body.accessTokenExpiresAt,
    })

    return NextResponse.json({ok: true})
}

export async function DELETE() {
    await deleteSession()
    return NextResponse.json({ok: true})
}
