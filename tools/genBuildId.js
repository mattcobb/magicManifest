require.paths.unshift( __dirname + '/../../common');

var uuid = require('node-uuid');

var buildId = uuid();
var platConf = require("ib_platform_conf.js").config;

console.log(buildId);

var fs = require("fs");

var out = {"buildId": buildId};

fs.writeFile(platConf.buildClientInfo, JSON.stringify(out), function(err) {
    if(err) {
        console.log("error when generating buildid " + err);
    }
});
