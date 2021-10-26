// vetur.config.js
/** @type {import('vls').VeturConfig} */
module.exports = {
    settings: {
        "vetur.useWorkspaceDependencies": true,
        "vetur.experimental.templateInterpolationService": true
    },
    projects: [
        {
            root: "./static-web",
            jsconfig: "./jsconfig.json",
            globalComponents: [
                "./js/app/components/*.vue"
            ]
        }
    ]
};