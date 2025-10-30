export const readCookie = (name) => {
  if (typeof document === 'undefined') {
    return null
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export const writeCookie = (name, value, { maxAgeSeconds, path = '/', sameSite = 'Lax', secure = false } = {}) => {
  if (typeof document === 'undefined') {
    return
  }
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    `path=${path}`,
    `SameSite=${sameSite}`,
  ]
  if (typeof maxAgeSeconds === 'number') {
    attributes.push(`max-age=${maxAgeSeconds}`)
  }
  if (secure || window.location.protocol === 'https:') {
    attributes.push('Secure')
  }
  document.cookie = attributes.join('; ')
}

export const deleteCookie = (name) => {
  if (typeof document === 'undefined') {
    return
  }
  document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax`
}
