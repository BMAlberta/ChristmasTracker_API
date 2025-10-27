export class Response {
	constructor(error = null, code = null, payload) {
		if (error != null) {
			this.error = {
				message: error,
                code:  code
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
	return new Response(null, null, payload)
}


export function ErrorResponse(message) {
	return new Response(message, null, null)
}

export function ErrorCodeResponse(message) {
    return new Response(message, null, null
    )
}
