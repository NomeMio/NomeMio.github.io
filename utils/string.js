export function isPrintable(str) {
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code < 32 || code > 126) {
            return false;
        }
    }
    return true;
}

export function isAlphanumericUnderscore(str) {
    // Returns true if str contains only a-z, A-Z, 0-9, or _
    return /^[a-zA-Z0-9_]+$/.test(str);
}