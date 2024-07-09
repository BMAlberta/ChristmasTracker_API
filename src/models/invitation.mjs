import mongoose from 'mongoose';
const inviteSchema = new mongoose.Schema({

	creationDate: {
		type: Date,
		required: true,
		default: Date.now,
		index: {
			expireAfterSeconds: 600
		}
	},
	invitationCode: {
		type: String,
		required: false,
		default: ""
	},
	userId: {
		type: String,
		required: true,
		default: ""
	},
	listId: {
		type: String,
		required: true,
		default: ""
	}
})
export default mongoose.model('Invitation', inviteSchema);
