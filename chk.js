/**
 * ⚠️ ACADEMIC RESEARCH USE ONLY
 * For authorized testing environments that comply with all applicable laws.
 * See: https://github.com/botswin/FakeVision-Reverse/blob/main/DISCLAIMER.md
 */

// @ts-check

// This is the most important part, fv.pro sends encrypted data via https://api.fv.pro/chk and then returns whether anti detect.
// The code comes from the data in these js and then decodes via wasm.
// [
//     'https://fingerly-script.fvpro.workers.dev/0.js',
//     'https://fingerly-script.fvpro.workers.dev/1.js',
//     'https://fingerly-script.fvpro.workers.dev/2.js',
//     'https://fingerly-script.fvpro.workers.dev/3.js',
//     'https://fingerly-script.fvpro.workers.dev/4.js',
//     'https://fingerly-script.fvpro.workers.dev/5.js',
//     'https://fingerly-script.fvpro.workers.dev/6.js',
//     'https://fingerly-script.fvpro.workers.dev/7.js',
//     'https://fingerly-script.fvpro.workers.dev/wllt.js',
//   ],

const _0x59a92a = {
    alg: 'RSA-OAEP-256',
    e: 'AQAB',
    ext: true,
    key_ops: ['encrypt'],
    kty: 'RSA',
    n: '8DJNossKBi-kNHAmIckUEs2ceEm32xlIwjqEtJ4gtxsLHdSa8HLs2SM6tFvxLQCkq9B_dWkZ1U1B0iH5oy4EaAOqC-NhZDh_UWTLRvoj9bHFFGFhRTOG80ztY-aeGuSeE5q3k86t9dgBA3v-BBW9u_ISuOd_hJvb6Z8kZmheak74uXRFTKkjO9SawZa-9cKC82lucYQeHPBWiqg7F8o15TSKtBqa8KD5_RYel3BZpUaN1mdQIO0HHiFbxeb2lLXcPlXL1cSGD1bOeQJ75i_0Sl50DHI6vM7SZpxRYc6dVO4trG05bGfNoQtmbww_UXzcOEi4LZI-4Ed42oTQxP3rTw',
}

async function encrypt(_0x5bcb9f, _0x23533a) {
    const _0xcca7f9 = {
        name: 'SHA-256',
    }
    const _0x76cc6c = {
        name: 'RSA-OAEP',
        hash: _0xcca7f9,
    }
    const _0x36ac6d = await crypto.subtle.importKey('jwk', _0x23533a, _0x76cc6c, true, ['encrypt'])
    const _0x195f77 = {
        name: 'RSA-OAEP',
    }
    return await crypto.subtle.encrypt(_0x195f77, _0x36ac6d, _0x5bcb9f)
}

async function encode(obj) {
    const _0x1d4119 = crypto.getRandomValues(new Uint8Array(12))
    const _0x6c1f4b = {
        name: 'AES-GCM',
        length: 0x100,
    }
    const _0x22ab92 = await crypto.subtle.generateKey(_0x6c1f4b, true, ['encrypt', 'decrypt'])
    const _0xc9da4d = await crypto.subtle.exportKey('raw', _0x22ab92)
    const _0xda388f = await encrypt(_0xc9da4d, _0x59a92a)
    const _0x143bf8 = JSON.stringify(obj)
    const _0xb1b97 = new TextEncoder().encode(_0x143bf8)
    const _0x104fa6 = {
        name: 'AES-GCM',
        iv: _0x1d4119,
    }
    const _0x1fee64 = await crypto.subtle.encrypt(_0x104fa6, _0x22ab92, _0xb1b97)
    const encryptedData = btoa(String.fromCharCode(...new Uint8Array(_0x1fee64)))
    const iv = btoa(String.fromCharCode(...new Uint8Array(_0x1d4119)))
    const encryptedKey = btoa(String.fromCharCode(...new Uint8Array(_0xda388f)))
    return [encryptedData, iv, encryptedKey]
}
