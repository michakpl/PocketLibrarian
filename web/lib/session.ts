import 'server-only'
import {EncryptJWT, jwtDecrypt} from 'jose'
import {cookies} from 'next/headers'
import {randomUUID} from 'crypto'
import redis from '@/lib/redis'

export {isAccessTokenExpired} from '@/lib/session-utils'

// When REDIS_ENABLED=false, the access token is embedded in the cookie using
// JWE (EncryptJWT, dir/A256GCM). The cookie is httpOnly + encrypted, so the
// token payload is not readable by the browser or any party without SESSION_SECRET.
const redisEnabled = redis !== null

export interface SessionPayload {
    sessionId: string
    userId: string
    name: string
    email: string
    accessToken: string
    accessTokenExpiresAt: number
}

interface CookiePayload {
    sessionId: string
    userId: string
    name: string
    email: string
    accessTokenExpiresAt: number
    accessToken?: string // only present when Redis is disabled
}

const SESSION_COOKIE = 'pocketlibrarian.session'
const SESSION_DURATION_DAYS = 7
const SESSION_TTL_SECONDS = SESSION_DURATION_DAYS * 24 * 60 * 60
const REDIS_KEY_PREFIX = 'session:'

function getEncodedKey(): Uint8Array {
    const secretKey = process.env.SESSION_SECRET
    if (!secretKey) throw new Error('SESSION_SECRET environment variable is not set')
    const key = new TextEncoder().encode(secretKey)
    if (key.length < 32) throw new Error('SESSION_SECRET must be at least 32 bytes for AES-256-GCM encryption')
    return key.slice(0, 32)
}

export async function encrypt(payload: CookiePayload): Promise<string> {
    return new EncryptJWT({...payload})
        .setProtectedHeader({alg: 'dir', enc: 'A256GCM'})
        .setIssuedAt()
        .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
        .encrypt(getEncodedKey())
}

export async function decrypt(session: string | undefined): Promise<CookiePayload | null> {
    if (!session) return null
    try {
        const {payload} = await jwtDecrypt(session, getEncodedKey())
        return payload as unknown as CookiePayload
    } catch {
        return null
    }
}

export async function createSession(payload: SessionPayload): Promise<void> {
    const sessionId = payload.sessionId ?? randomUUID()

    const cookiePayload: CookiePayload = {
        sessionId,
        userId: payload.userId,
        name: payload.name,
        email: payload.email,
        accessTokenExpiresAt: payload.accessTokenExpiresAt,
    }

    if (redisEnabled) {
        await redis!.set(
            `${REDIS_KEY_PREFIX}${sessionId}`,
            payload.accessToken,
            'EX',
            SESSION_TTL_SECONDS,
        )
    } else {
        cookiePayload.accessToken = payload.accessToken
    }

    const token = await encrypt(cookiePayload)
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_TTL_SECONDS,
    })
}

export async function deleteSession(): Promise<void> {
    const cookieStore = await cookies()
    const raw = cookieStore.get(SESSION_COOKIE)?.value
    if (redisEnabled) {
        const payload = await decrypt(raw)
        if (payload?.sessionId) {
            await redis!.del(`${REDIS_KEY_PREFIX}${payload.sessionId}`)
        }
    }
    cookieStore.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies()
    const raw = cookieStore.get(SESSION_COOKIE)?.value
    const cookiePayload = await decrypt(raw)
    if (!cookiePayload) return null

    if (redisEnabled) {
        const accessToken = await redis!.get(`${REDIS_KEY_PREFIX}${cookiePayload.sessionId}`)
        if (!accessToken) return null
        return {...cookiePayload, accessToken}
    }

    if (!cookiePayload.accessToken) return null
    return cookiePayload as SessionPayload
}
