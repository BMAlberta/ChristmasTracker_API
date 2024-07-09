export class Response {
	constructor(error = null, payload) {
		if (error != null) {
			this.error = {
				message: error
			}
		} else {
			this.error = {}
		}

		if (payload != null) {
			this.payload = payload
		} else {
			this.payload = {}
		}
	}
}



export function DataResponse(payload) {
	return new Response(null, payload)
}


export function ErrorResponse(message) {
	return new Response(message, null)
}

function NewErrorResponse(message, payload) {
	return new Response(message, payload)
}


