const Config = require("../config.js");
const Logger = require("./logger.js");
const http = require("http");

function _sendWebRequest(path, baseurl, method, data, callback) {
    if (method === "GET" || method === "POST") {
        let hasPostData = false;
        let postData = null;
        const finalUri = new URL(path, baseurl);

        Logger.debug(`_sendWebRequest: ${finalUri} - Sending request...`);

        const options = {
            host: finalUri.hostname,
            port: finalUri.port,
            timeout: Config.timing.rpc_timeout,
            path: finalUri.pathname,
            method: method,
            headers: {
                "User-Agent": Config.app.web_user_agent
            }
        };

        if (finalUri.searchParams && finalUri.searchParams !== null && Object.keys(finalUri.searchParams) > 0) {
            options.path += "?" + finalUri.searchParams;
        }

        if (method === "POST" && data !== undefined && data !== null) {
            hasPostData = true;
            postData = JSON.stringify(data);
            options.headers["Content-Type"] = "application/json";
            options.headers["Content-Length"] = postData.length;
        }

        let startProcessTime = 0;
        const request = http.request(options, function (response) {
            let receivedData = "";

            // Is this truley the best way to wait for a JSON response, by appending a string on each data chunk received?
            response.on("data", function (chunk) {
                receivedData += chunk;
            });

            //the whole response has been received, so we just print it out here
            response.on("end", function () {
                const elapsedMs = process.hrtime(startProcessTime)[1] / 1000000; // nanoseconds to milliseconds
                const elapsedMsString = `${process.hrtime(startProcessTime)[0]}s, ${elapsedMs.toFixed(3)}ms`;
                Logger.debug(`_sendWebRequest: ${finalUri} - Request complete: ${response.statusCode} ${response.statusMessage} (${elapsedMsString})`);

                // Create a configuration option to show response headers?
                // if (response.headers && response.headers !== null) {
                //     Logger.debug(`${finalUri} - Headers:`);
                //     Object.keys(response.headers).forEach(header => {
                //         Logger.debug(`${finalUri} -   '${header}': ${response.headers[header]}`);
                //     });
                // }

                switch (response.statusCode) {
                case 200:
                    callback(null, JSON.parse(receivedData));
                    break;
                case 500:
                    callback(response.statusCode + " " + response.statusMessage, receivedData);
                    break;
                default:
                    Logger.warn(`_sendWebRequest: ${finalUri} - Received a status code with no explicit handler. Not sure what to do with a ${response.statusCode}.`);
                    callback(response.statusCode + " " + response.statusMessage);
                }
            });
        });

        request.on("error", function (error) {
            callback(error);
        });

        request.on("timeout", function () {
            const elapsedMs = process.hrtime(startProcessTime)[1] / 1000000; // nanoseconds to milliseconds
            const elapsedMsString = `${process.hrtime(startProcessTime)[0]}s, ${elapsedMs.toFixed(3)}ms`;
            Logger.debug(`_sendWebRequest: ${finalUri} - Request timeout (${elapsedMsString}).`);
            request.destroy(); // Abort the request if we've gotten no response.
        });

        if (hasPostData) {
            Logger.debug(`_sendWebRequest: ${finalUri} - Sending post data: ${postData}`);
            request.write(postData);
        }

        startProcessTime = process.hrtime();
        request.end();
    } else {
        callback(`Invalid method: ${method}. Only 'GET' and 'POST' are supported.`);
    }
}

// function _sendGetRequest(path, baseurl, callback) {
//     _sendWebRequest(path, baseurl, "GET", null, callback);
// }

function _sendPostRequest(path, baseurl, postdata, callback) {
    _sendWebRequest(path, baseurl, "POST", postdata, callback);
}

const rpc_api = {
    proxycmd: function (peer, body, callback) {
        if (peer && peer !== "") {
            if (body && body !== null) {
                _sendPostRequest("/public/", `http://${peer}`, body, function (postRequestError, postRequestData) {
                    if (!postRequestError) {
                        if (postRequestData) {
                            if (!postRequestData.error) {
                                // Should we do some kind of check of the id here?
                                callback(null, postRequestData.result);
                            } else {
                                callback(`Node RPC call error: ${postRequestData.error}`);
                            }
                        } else {
                            callback("No data was received by peer.");
                        }
                    } else {
                        callback(postRequestError);
                    }
                });
            } else {
                callback("Missing post body payload.");
            }
        } else {
            callback("Missing 'peer' query parameter.");
        }
    },
    genericRPCCall: function (command, params, id) {
        if (!params) {
            params = {};
        }
        if (!id) {
            id = "";
        }
        return {
            method: `${command}`,
            params: params,
            id: id // What should we do with this id, is this a correlation id used for async?
        };
    }
};

module.exports = rpc_api;