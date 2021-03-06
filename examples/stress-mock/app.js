#!/usr/bin/env node
'use strict'

const openapiMock = require("@varkes/openapi-mock")
const odataMock = require("@varkes/odata-mock")
const server = require("@varkes/api-server")
const cockpit = require("@varkes/cockpit");
const config = require("@varkes/configuration")
const app = require('express')()
let fs = require("fs")

const OPENAPI_COUNT = process.env.OPENAPI ? parseInt(process.env.OPENAPI) : 100;
const ODATA_COUNT = process.env.ODATA ? parseInt(process.env.ODATA) : 100;
const EVENT_COUNT = process.env.EVENT ? parseInt(process.env.EVENT) : 100;

let runAsync = async () => {
    let port
    if (process.argv.length > 2 && parseInt(process.argv[2])) {
        port = process.argv[2]
    }

    let generatedConfig = generateConfig()
    if (!fs.existsSync("./generated/")) {
        fs.mkdirSync("./generated/");
    }
    fs.writeFileSync("./generated/varkes_config.json", JSON.stringify(generatedConfig, null, 2))
    try {
        let configuration = await config.resolveFile("./generated/varkes_config.json", __dirname)
        app.use(await cockpit.init(configuration))
        app.use(await server.init(configuration))
        app.use(await odataMock.init(configuration))
        app.use(await openapiMock.init(configuration))
        if (port)
            app.listen(port, function () {
                console.info("Started application on port %d with %d OpenAPIs, %d ODatas and %d Events", port, OPENAPI_COUNT, ODATA_COUNT, EVENT_COUNT)
            });
        return app
    } catch (error) {
        console.error("Problem while starting application: %s", JSON.stringify(error))
    }
}

function generateConfig() {
    let configuration = {
        name: "Stress-Mock",
        apis: [],
        events: []
    }

    for (let i = 1; i < OPENAPI_COUNT + 1; i++) {
        configuration.apis.push({
            basepath: "/api" + i + "/v1",
            name: "OpenAPI " + i,
            type: "openapi",
            specification: "../apis/schools.yaml"
        })
    }
    for (let i = 1; i < ODATA_COUNT + 1; i++) {
        configuration.apis.push({
            name: "OData " + i,
            specification: "../apis/services.xml",
            basepath: "/api" + i + "/odata",
            type: "odata"
        })
    }
    for (let i = 1; i < EVENT_COUNT + 1; i++) {
        configuration.events.push({
            name: "Event " + i,
            specification: "../apis/events.json"
        })
    }
    return configuration
}
module.exports = runAsync()
