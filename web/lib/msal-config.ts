import { BrowserCacheLocation, type Configuration } from '@azure/msal-browser'

const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ?? ''
const tenantId = process.env.NEXT_PUBLIC_AZURE_TENANT_ID ?? 'common'

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth` : '/auth',
    postLogoutRedirectUri: '/auth',
  },
  cache: {
    cacheLocation: BrowserCacheLocation.SessionStorage,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii || process.env.NODE_ENV !== 'development') return
        console.debug(`[MSAL] ${message}`)
      },
    },
  },
}

const apiScopeBase = process.env.NEXT_PUBLIC_API_SCOPE_BASE

export const loginRequest = {
  scopes: [
    `${apiScopeBase}/book.read`,
    `${apiScopeBase}/book.write`,
    `${apiScopeBase}/location.read`,
    `${apiScopeBase}/location.write`,
  ],
}
