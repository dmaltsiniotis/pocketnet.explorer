const Config = require("../config.js");
const Logger = require("./logger.js");
const CronJob = require("cron").CronJob;
const Automation = require("./automation.js");

const minuteInternal = Config.timing.node_check_interval / 60 / 1000;
const refreshNodesCronSchedule = `0 */${minuteInternal} * * * *`;
const everyOneMinute = `0 */1 * * * *`;

const refreshAllNodesJob = new CronJob(refreshNodesCronSchedule, function () {
    Logger.info(`JOB refreshAllNodesJob - Running...`);
    Automation.refreshAllNodes(function (refreshAllNodesError, refreshAllNodesData) {
        if (!refreshAllNodesError) {
            Logger.info(`JOB refreshAllNodesJob:`);
            Logger.info(refreshAllNodesData);
        } else {
            Logger.error(`refreshAllNodesJob - ${refreshAllNodesError}`);
        }
    });
}, null, Config.app.run_jobs);

const refreshAllStatusesJob = new CronJob(everyOneMinute, function () {
    Logger.info(`JOB refreshAllStatusesJob - Running...`);
    Automation.refreshAllNodeStatuses(function (refreshAllNodeStatusesError, refreshAllNodeStatusesData) {
        if (!refreshAllNodeStatusesError) {
            Logger.info(`JOB refreshAllStatusesJob:`);
            Logger.info(refreshAllNodeStatusesData);
        } else {
            Logger.error(`refreshAllStatusesJob - ${refreshAllNodeStatusesError}`);
        }
    });
}, null, Config.app.run_jobs);

const Cron = {
    start: function (callback) {
        //Logger.debug(refreshNodesCronSchedule);
        refreshAllNodesJob.start();
        refreshAllStatusesJob.start();
        callback();
    },
    stop: function (callback) {
        refreshAllNodesJob.stop();
        refreshAllStatusesJob.stop();
        callback();
    }
};

module.exports = Cron;