class Response {
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



function DataResponse(payload) {
	return new Response(null, payload)
}


function ErrorResponse(message) {
	return new Response(message, null)
}

function NewErrorResponse(message, payload) {
	return new Response(message, payload)
}

module.exports = {
	Response,
	DataResponse,
	ErrorResponse,
	NewErrorResponse
}
