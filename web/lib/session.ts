import 'server-only'
import {SignJWT, jwtVerify} from 'jose'
import {cookies} from 'next/headers'
import {randomUUID} from 'crypto'
import redis from '@/lib/redis'

export {isAccessTokenExpired} from '@/lib/session-utils'

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
}

const SESSION_COOKIE = 'pocketlibrarian.session'
const SESSION_DURATION_DAYS = 7
const SESSION_TTL_SECONDS = SESSION_DURATION_DAYS * 24 * 60 * 60
const REDIS_KEY_PREFIX = 'session:'

const secretKey = process.env.SESSION_SECRET
if (!secretKey) throw new Error('SESSION_SECRET environment variable is not set')
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: CookiePayload): Promise<string> {
    return new SignJWT({...payload})
        .setProtectedHeader({alg: 'HS256'})
        .setIssuedAt()
        .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
        .sign(encodedKey)
}

export async function decrypt(session: string | undefined): Promise<CookiePayload | null> {
    if (!session) return null
    try {
        const {payload} = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256'],
        })
        return payload as unknown as CookiePayload
    } catch {
        return null
    }
}

export async function createSession(payload: SessionPayload): Promise<void> {
    const sessionId = payload.sessionId ?? randomUUID()

    await redis.set(
        `${REDIS_KEY_PREFIX}${sessionId}`,
        payload.accessToken,
        'EX',
        SESSION_TTL_SECONDS,
    )

    const cookiePayload: CookiePayload = {
        sessionId,
        userId: payload.userId,
        name: payload.name,
        email: payload.email,
        accessTokenExpiresAt: payload.accessTokenExpiresAt,
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
    const payload = await decrypt(raw)
    if (payload?.sessionId) {
        await redis.del(`${REDIS_KEY_PREFIX}${payload.sessionId}`)
    }
    cookieStore.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies()
    const raw = cookieStore.get(SESSION_COOKIE)?.value
    const cookiePayload = await decrypt(raw)
    if (!cookiePayload) return null

    const accessToken = await redis.get(`${REDIS_KEY_PREFIX}${cookiePayload.sessionId}`)
    if (!accessToken) return null

    return {...cookiePayload, accessToken}
}
