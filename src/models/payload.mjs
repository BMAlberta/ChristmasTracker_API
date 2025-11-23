export class Response {
    constructor(error = null, payload) {
        if (error != null) {
            this.error = {
                code:  error.code,
                message: error.msg

            }
        } else {
            // this.error = {}
            delete this.error
        }
        if (payload != null) {
            this.payload = payload
        } else {
            delete this.payload
        }
    }
}


export function DataResponse(payload) {
	return new Response(null, payload)
}


export function ErrorResponse(message) {
	return new Response(message,null)
}

export function ErrorCodeResponse(message) {
    return new Response(message, null, null
    )
}
