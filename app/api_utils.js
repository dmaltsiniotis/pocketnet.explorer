/*jslint this*/
const logger = require("./logger.js");

const STATUS = {
    OK: "OK",
    ERROR: "ERROR",
    REDIRECT: "REDIRECT"
};

function createBlankApiResponse() {
    const apiResponse = {
        status: null,
        data: null,
        error: null,
        url: null
    };
    return apiResponse;
}

const apiUtils = {
    apiOk: function (expressResponse, data) {
        const responseJson = createBlankApiResponse();
        responseJson.status = STATUS.OK;
        responseJson.data = data;
        expressResponse.json(responseJson);
    },

    apiRedirect: function (expressResponse, url) {
        const responseJson = createBlankApiResponse();
        responseJson.status = STATUS.REDIRECT;
        responseJson.url = url;
        expressResponse.json(responseJson);
    },

    apiError: function (expressResponse, error, data) {
        const responseJson = createBlankApiResponse();
        responseJson.status = STATUS.ERROR;
        responseJson.error = error;
        responseJson.data = data;
        logger.warn(error); // Lets be a bit cheeky and proactivelly throw warnings when users are getting app/data errors.
        expressResponse.status(400).json(responseJson);
    },

    apiResponseGeneric: function (expressResponse, error, data) {
        if (!error) {
            this.apiOk(expressResponse, data);
        } else {
            this.apiError(expressResponse, error, data);
        }
    },

    apiNotImplemented: function (expressResponse) {
        const responseJson = createBlankApiResponse();
        responseJson.status = STATUS.ERROR;
        responseJson.error = "Not yet implemented.";
        logger.warn(responseJson.error); // Lets be a bit cheeky and proactivelly throw warnings when users are getting app/data errors.
        expressResponse.status(500).json(responseJson);
    }
};
module.exports = apiUtils;