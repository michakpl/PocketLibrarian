export class UnauthorizedError extends Error {
    constructor() {
        super('Access token rejected by API (401)')
        this.name = 'UnauthorizedError'
    }
}