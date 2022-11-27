const crypto = require('crypto');
const algorithm = 'aes-256-ctr';
const ENCRYPTION_KEY = process.env.OTP_ENCRYPTION_SECRET;
const IV_LENGTH = 16;

function encrypt(text) {
	const key = getKey()
	let iv = crypto.randomBytes(IV_LENGTH);
	let cipher = crypto.createCipheriv(algorithm, key, iv);
	let encrypted = cipher.update(text);
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	return iv.toString('base64') + ':' + encrypted.toString('base64');
}

function decrypt(text) {
	const key = getKey()
	let textParts = text.split(':');
	let iv = Buffer.from(textParts.shift(), 'base64');
	let encryptedText = Buffer.from(textParts.join(':'), 'base64');
	let decipher = crypto.createDecipheriv(algorithm, key, iv);
	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decrypted.toString();
}

function getKey() {
	let pass = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substr(0, 32);
	let key = crypto.scryptSync(pass, 'ENCRYPTION_KEY', 32);
	return key
}

module.exports = {
	encrypt,
	decrypt
}
