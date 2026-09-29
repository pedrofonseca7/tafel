// Gera um par de chaves VAPID novo para as notificações push.
// Corre com: node scripts/generate-vapid-keys.js
// Copia o resultado para as variáveis de ambiente (.env.local e no Vercel).
const crypto = require('crypto')

function b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' })

const pubJwk = publicKey.export({ format: 'jwk' })
const x = Buffer.from(pubJwk.x, 'base64')
const y = Buffer.from(pubJwk.y, 'base64')
const rawPub = Buffer.concat([Buffer.from([0x04]), x, y])

const privJwk = privateKey.export({ format: 'jwk' })
const rawPriv = Buffer.from(privJwk.d, 'base64')

console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + b64url(rawPub))
console.log('VAPID_PRIVATE_KEY=' + b64url(rawPriv))
