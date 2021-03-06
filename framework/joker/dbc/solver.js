// Includes
var fs = require('fs');
var mfile = require('spooky/io/file');
var mstep = require('spooky/sync/step');
var mrequest = require('joker/dbc/request');
var mresponse = require('joker/dbc/response');

// Constructor
function DBCSolver() {
    // Empty for now :()
} 


// Send request and parse response
DBCSolver.prototype.solveFile = function(filename, callback) {
    this.filename = filename;

    if(!filename) {
        console.log("Bad filename");
        callback(null);
        return null;
    }

    // Flow
    mstep.Step(
        // Send request
        function sendRequest() {
            var request = new mrequest.DBCRequest(filename);
            request.send(this);
        },
        // Parse response
        function parseResponse(result_page) {
            var response = new mresponse.DCBResponse(result_page);
            var that = this;
            var f = function(arg) { that(arg); };
            response.getResult(f);
        },
        // Return captcha
        function doCallback(captcha) {
            callback(captcha);
        }
    );

}


// Write data to file and solve as file
DBCSolver.prototype.solveData = function(image_data, callback) {
    var _this = this;
    var filename = mfile.randomTempFile();

    // null or undefined
    if(!image_data) {
        console.log("Content is bad");
        callback(null);
        return null;
    }

    // Flow
        // Write file
        var writeFile = function () {
            fs.write(filename, image_data, 'w');
        };

        // Solve for data
        var solveForData = function () {
            _this.solveFile(filename, callback);
        };

        writeFile();
        solveForData();
}


// Fetch url, and solve for data
DBCSolver.prototype.solveURL = function(url, callback) {
    var _this = this;
    // TODO proxy support
    var page = new WebPage();
    var filename = null;

    // Flow
    mstep.Step(
        // Fetch content
        function fetchContent() {
            var that = this;
            var f = function(arg) { that(arg); }
            page.open(url, f);
        },
        function parseContent(status) {
            if(status !== 'success') {
                var turl = page.evaluate(function() { return document.baseURI; });

                console.log("Failure loading page : "+status+" ("+url+").");
                return null;
            }
            return null;
        },
        function renderToFile() {
            // Render to a random path in /tmp
            filename = page !== null ? mfile.randomTempFile() : null;
            if(filename) {
                filename += ".png";
                console.log("filename = "+filename);
                page.render(filename);
            }
            return null;
        },
        function solveForFile() {
            return _this.solveFile(filename, callback);
        }
    );
}


// Exports
exports.DBCSolver = DBCSolver
