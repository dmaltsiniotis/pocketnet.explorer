if (process.env.NODE_ENV !== "production") {
    const result = require("dotenv").config();
    if (result.error) {
        throw result.error;
    }
}

const config = require("./config.js");
const logger = require("./app/logger.js");

config.debugprint(logger);

const app = require("./app/app.js");

const express = require("express");
const expressApp = express();

function shutdown(signal, httpServer) {
    return function (err) {
        logger.info(`Caught ${signal} signal, starting shutdown sequence.`);
        if (err) {
            logger.error(err.stack || err);
        }

        logger.info("Setting a five second timer to wait for gracefully shutdown before force exiting...");
        setTimeout(function () {
            logger.info("Waited five seconds (should investigate why shutdown took so long), forcing exit process...");
            const exit_code = (
                err
                ? 1
                : 0
            );
            process.exit(exit_code); // Exit with non-zero code if there was an error.
        }, 5000).unref();

        app.shutdownExpress(httpServer, function () {
            logger.info("App shut down, exiting process...");
            process.exit(0);
        });
    };
}

app.initDatabase(function (dbConnectionError) {
    if (!dbConnectionError) {
        app.initExpress(expressApp, function () {
            app.startExpress(expressApp, function (startExpressError, expressHttpServer) {
                if (!startExpressError) {
                    app.startCron(function () {
                        process.on("SIGTERM", shutdown("SIGTERM", expressHttpServer)).on("SIGINT", shutdown("SIGINT", expressHttpServer)).on("uncaughtException", shutdown("uncaughtException", expressHttpServer));
                    });
                } else {
                    logger.error(startExpressError);
                    process.exit(1);
                }
            });
        });
    } else {
        logger.error(dbConnectionError);
        process.exit(1);
    }
});
