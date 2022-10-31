const crypto = require("crypto");

const aes256IvLength = 16;
const aes256IvStringLength = 32;

function encrypt(data) {
    const key = Buffer.from(process.env.AES_KEY, "hex");
    const iv = crypto.randomBytes(aes256IvLength);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    return iv.toString("hex") + cipher.update(data, "utf8", "hex") + cipher.final("hex");
}

function decrypt(data) {
    const key = Buffer.from(process.env.AES_KEY, "hex");
    const iv = Buffer.from(data.slice(0, aes256IvStringLength), "hex");
    const encryptedActualData = data.slice(aes256IvStringLength);
    const cipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    return cipher.update(encryptedActualData, "hex", "utf8") + cipher.final("utf8");
}

module.exports = {
    encrypt,
    decrypt
};