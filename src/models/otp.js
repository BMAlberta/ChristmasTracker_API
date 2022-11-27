const mongoose = require('mongoose')
const otpSchema = new mongoose.Schema({

	otpCode: {
		type: String,
		required: false,
		default: ""
	},
	expirationDate: {
		type: Date,
		required: true,
		default: Date.now
	},
	verified: {
		type: Boolean,
		required: false,
		default: false
	},
	creationDate: {
		type: Date,
		required: true,
		default: Date.now,
		index: {
			expireAfterSeconds: 600
		}
	},
	lastUpdateDate: {
		type: Date,
		required: true,
		default: Date.now
	}
})

module.exports = mongoose.model('OTP', otpSchema)
