const config = require("../config.js");
const logger = require("./logger.js");

const http = require("http");
const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const api = require("./api.js");
const cron = require("./cron.js");
const expresMiddleware = require("./middleware/expressmiddleware.js");

function _initDatabase(callback) {
    mongoose.set("bufferCommands", false);
    mongoose.connection.on("error", function (databaseError) {
        logger.error(databaseError);
    });
    mongoose.connection.once("open", function () {
        logger.info("Database connection established.");
    });

    const dbOptions = { // https://mongoosejs.com/docs/deprecations.html
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    };

    mongoose.connect(config.db.uri, dbOptions, callback);
}

function _initExpressMiddleware(expressApp) {
    expressApp.use(express.json());
    expressApp.use(cookieParser());
    expressApp.use(expresMiddleware.routelogger());
}

function _initExpresStaticContent(expressApp) {
    expressApp.use(express.static("static-web"));
}

function _registerApiEndpoints(expressApp) {
    // Register the rest of our API here...
    //const apiprefix = "/api/1.0/";
    if (api.get) {
        Object.keys(api.get).forEach(function (methodname) {
            expressApp.get(`/${methodname}`, api.get[methodname]);
        });
    }

    if (api.post) {
        Object.keys(api.post).forEach(function (methodname) {
            expressApp.post(`/${methodname}`, api.post[methodname]);
        });
    }
}

const app = {
    initDatabase: function (callback) {
        logger.info("Initilizing database...");
        _initDatabase(callback);
    },
    initExpress: function (expressApp, callback) {
        logger.info("Initilizing express static content...");
        _initExpresStaticContent(expressApp);

        logger.info("Initilizing express middleware...");
        _initExpressMiddleware(expressApp);

        logger.info("Initilizing express API endpoints...");
        _registerApiEndpoints(expressApp);

        callback();
    },
    startExpress: function (expressApp, callback) {
        const httpServer = http.createServer(expressApp);
        httpServer.listen(config.app.web_port, function () {
            logger.info(`Web app is now ready and listening on port ${config.app.web_port}.`);
            callback(null, httpServer);
        });
    },
    startCron: function (callback) {
        if (config.app.run_jobs) {
            logger.info(`Initilizing cron jobs...`);
            cron.start(function () {
                callback();
            });
        } else {
            logger.info(`run_jobs is false, skipping cron jobs...`);
            callback();
        }
    },
    shutdownExpress: function (httpServer, callback) {
        logger.info("Shutting down Express...");
        httpServer.close(function () {
            logger.info("Http server closed.");
            // Clean up, shutdown, flush files, etc...
            callback();
        });
    },
    shutdownDatabase: function (callback) {
        logger.info("PLACEHOLDER: Flushing database connections and shutting down database...");
        callback();
    }
};

module.exports = app;