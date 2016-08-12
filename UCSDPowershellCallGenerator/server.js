/// Poor Man's Web Server
/// (C)opyright 2016 Nocturnal Holdings AS

var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
port = process.argv[2] || 8080;

http.createServer(function (request, response) {
    var uri = url.parse(request.url).pathname;
    var filename = path.join(process.cwd(), uri);

    console.log(filename);

    var stats = fs.lstatSync(filename);

    if (stats.isDirectory()) {
        filename += '\\index.html';
        stats = fs.lstatSync(filename);
    }

    try {
        if (stats == null || !stats.isFile()) {
            throw "File not found";
        }

        fs.accessSync(filename, fs.R_OK, function (err) {
            throw "File not readable";
        });        
    } catch (e) {
        response.writeHead(404, { "Content-Type": "text/plain" });
        response.write(e.message + "\n");
        response.end();
        return;
    }

    var mimeType = "text/plain";
    switch(path.extname(filename).toLowerCase())
    {
        case '.html':
            mimeType = "text/html";
            break;
        case '.js':
            mimeType = "application/javascript";
            break;
        case '.css':
            mimeType = "text/css";
            break;
        case '.json':
            mimeType = "application/json";
            break;
    }

    fs.readFile(filename, "binary", function (err, file) {
        if (err) {
            response.writeHead(500, { "Content-Type": "text/plain" });
            response.write(err + "\n");
            response.end();
            return;
        }

        response.writeHead(200, { "Content-Type": mimeType });
        response.write(file, "binary");
        response.end();
    });
}).listen(parseInt(port, 10));

console.log('Poor man\'s web server');
console.log('--------------------------------------------')
console.log('Written by Darren Starr for testing some JavaScript');
console.log("Running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
