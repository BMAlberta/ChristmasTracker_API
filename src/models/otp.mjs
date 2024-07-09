import mongoose from 'mongoose';
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

export default mongoose.model('OTP', otpSchema);
