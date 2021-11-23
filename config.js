const config = {
    app: {
        log_level: 1, // This gets set/parsed below.
        web_port: Number(process.env.APP_WEB_PORT || process.env.PORT),
        web_user_agent: "PKEXPLORER/1.0.0 - The Pocketcoin network explorer",
        run_jobs: (process.env.RUN_JOBS === "true" || false)
    },
    timing: {
        tcp_probe_timeout: Number(process.env.TCP_PROBE_TIMEOUT || 5000),                       //  5 second default. How long to wait for TCP network probes.
        rpc_timeout: Number(process.env.RPC_TIMEOUT || 20000),                                  // 20 second default. How long to wait for RPC network calls.
        node_check_interval: Number(process.env.NODE_CHECK_INTERVAL || 120000),                 //  2 minute default. How often to run the process that checks to see if nodes need their info refreshed.
        node_info_refresh_age_limit: Number(process.env.NODE_INFO_REFRESH_AGE_LIMIT || 600000), // 10 minute default. If a node hasn't been refreshed in the last X (this value) initate an update of the node information.
        node_considered_dead: Number(process.env.NODE_CONSIDERED_DEAD || 3600000)               // 20 minute default. If a previously detected node cannot be reached anymore, consider it dead after this amount of time has passed.
    },
    db: {
        uri: process.env.DB_URI
    },
    debugprint: function (logger) {
        logger.debug(`Configuration loaded:`);
        logger.debug(`App web port: ${config.app.web_port}`);
        logger.debug(`Run jobs: ${config.app.run_jobs}`);
        logger.debug(`DB uri: ${config.db.uri}`);
        logger.debug(`TCP probe timeout: ${config.timing.tcp_probe_timeout} (${config.timing.tcp_probe_timeout / 1000.0} seconds)`);
        logger.debug(`RPC timeout: ${config.timing.rpc_timeout} (${config.timing.rpc_timeout / 1000.0} seconds)`);
        logger.debug(`Node check interval: ${config.timing.node_check_interval} (${config.timing.node_check_interval / 1000.0 / 60.0} minutes)`);
        logger.debug(`Node info refresh age limit: ${config.timing.node_info_refresh_age_limit} (${config.timing.node_info_refresh_age_limit / 1000.0 / 60.0} minutes)`);
        logger.debug(`Node considered dead after: ${config.timing.node_considered_dead} (${config.timing.node_considered_dead / 1000.0 / 60.0} minutes)`);
    }
};

function parseLogLevel(logLevelString) {
    let logLevel = 1;
    switch (logLevelString) {
    case "NONE":
        logLevel = 0;
        break;
    case "ERROR":
        logLevel = 1;
        break;
    case "WARNING":
        logLevel = 2;
        break;
    case "INFO":
        logLevel = 3;
        break;
    case "DEBUG":
        logLevel = 4;
        break;
    default:
        logLevel = 1;
    }
    return logLevel;
}

config.app.log_level = parseLogLevel(process.env.APP_LOG_LEVEL);

module.exports = config;