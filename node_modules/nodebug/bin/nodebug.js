#!/usr/bin/env node

"use strict";

var fs = require("fs");
var path = require("path");
var child_process = require("child_process");
var optimist = require("optimist");

var argv = optimist
    .usage("Usage: nodebug script.js [options]")
    .options("help",       { alias: "h", describe: "Show this help" })
    .options("web-host",   { "default": "127.0.0.1", describe: "Web host used by node-inspector" })
    .options("web-port",   { "default": 8080, describe: "Web port used by node-inspector" })
    .options("debug-port", { "default": 5858, describe: "Debug port used by node" })
    .options("debug-brk",  { "default": true, describe: "Break on first line of script" })
    .options("keep-alive", { "default": false, describe: "Keep child processes alive after exit" })
    .argv;

if (argv["help"]) {
    showHelp();
}

if (!argv["_"].length) {
    showError("script required", true);
}

var inspectorPath = findInspector();
var chromePath = findChrome();

if (!inspectorPath) {
    showError("node-inspector not found", false);
}

if (!chromePath) {
    showError("chrome not found", false);
}

var scriptProcess = executeScript();
var inspectorProcess = startInspector();
var chromeProcess = launchChrome();

process.on("exit", function () {
    if (!argv["keep-alive"]) {
        scriptProcess.kill();
        inspectorProcess.kill();
        chromeProcess.kill();
    }
});

/* Shows the help message and exits */
function showHelp() {
    console.log(optimist.help().trim());
    process.exit(0);
}

/* Shows an error message and exits */
function showError(message, includeHelp) {
    console.error("Error: " + message);
    
    if (includeHelp) {
        console.log(optimist.help().trim());
    }

    process.exit(1);
}

/* Searches for chrome */
function findChrome() {
    var paths = [];

    switch (process.platform) {
        case "win32":
            paths.push(path.join(process.env["LocalAppData"], "Google", "Chrome", "Application", "chrome.exe"));
            paths.push(path.join(process.env["ProgramFiles"], "Google", "Chrome", "Application", "chrome.exe"));
            paths.push(path.join(process.env["ProgramFiles(x86)"], "Google", "Chrome", "Application", "chrome.exe"));
            break;

        case "darwin":
            paths.push(path.join("/", "Applications", "Google Chrome.app", "Contents", "MacOS", "Google Chrome"));
            break;

        default:
            paths.push(path.join("/", "opt", "google", "chrome", "google-chrome"));
            break;
    }

    return firstExistingPath(paths);
}

/* Searches for node-inspector */
function findInspector() {
    var paths = [];

    switch (process.platform) {
        case "win32":
            paths.push(path.join(__dirname, "..", "node_modules", ".bin", "node-inspector.cmd"));
            break;

        default:
            paths.push(path.join(__dirname, "..", "node_modules", ".bin", "node-inspector"));
            break;
    }

    return firstExistingPath(paths);
}

/* Searches paths for the first one that exists */
function firstExistingPath(paths) {
    for (var i = 0; i < paths.length; i++) {
        if (fs.existsSync(paths[i])) {
            return paths[i];
        }
    }

    return null;
}

/* Executes the script with the node debugger attached */
function executeScript() {
    var args = [];

    if (argv["debug-brk"]) {
        args.push("--debug-brk=" + argv["debug-port"]);
    } else {
        args.push("--debug=" + argv["debug-port"]);
    }

    args = args.concat(argv["_"]);

    return child_process.spawn(process.execPath, args, { stdio: "inherit" }).on("exit", process.exit);
}

/* Starts node-inspector */
function startInspector() {
    var args = [];
    args.push("--web-host=" + argv["web-host"]);
    args.push("--web-port=" + argv["web-port"]);

    return child_process.spawn(inspectorPath, args);
}

/* Launches chrome */
function launchChrome() {
    var args = [];
    args.push("--app=http://" + argv["web-host"] + ":" + argv["web-port"] + "/debug?port=" + argv["debug-port"]);
    args.push("--user-data-dir=" + path.join(__dirname, "..", "ChromeProfile"));

    return child_process.execFile(chromePath, args).on("exit", process.exit);
}
