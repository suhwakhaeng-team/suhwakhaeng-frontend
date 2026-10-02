// Local preview only. Production entry must be validated by the server.
export function acceptsUTPreviewPassword(value: string) { return value === '1234'; }
export function validUTNickname(value: string) { return value.trim().length > 0 && value.trim().length <= 40; }
