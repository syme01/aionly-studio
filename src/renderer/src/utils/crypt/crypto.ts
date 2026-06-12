import CryptoJS from 'crypto-js'

export function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const charactersLength = characters.length
  for (let i = 0; i < 32; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

export function generateAesKey() {
  return CryptoJS.enc.Utf8.parse(generateRandomString())
}

export function encryptBase64(str) {
  // ... (这里应该是 encryptWithAes 函数的实现，但是原始代码中没有给出)
  return CryptoJS.enc.Base64.stringify(str)
}

export function encryptWithAes(message, aesKey) {
  const encrypted = CryptoJS.AES.encrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return encrypted.toString()
}

export function decryptWithAes(message, aesKey) {
  const decrypted = CryptoJS.AES.decrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return decrypted.toString(CryptoJS.enc.Utf8)
}
