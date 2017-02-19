
    var HTTP_PORT = 8081;

   // set up ========================
    var express  = require('express');
    var app      = express();                               // create our app w/ express
    var morgan = require('morgan');             // log requests to the console (express4)
    var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
    var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
    var http = require('http');
    var url = require('url');
    var path = require("path");
    var fs = require('fs');
    var multer = require('multer');
    var sys = require('sys');
    var exec = require('child_process').exec;
    var sockSvc = require('./socket-server.js');
    var dctSvc = require('./dct-server.js');//(HOST);
    var HOST = GetLocalEth0IpAddress();
        //dctSvc.init(HOST);
    // For gzipped files insert HTTP Header : 'Content-Encoding' , 'gzip' 
    app.use(function(request, response, next) {
            var uri = url.parse(request.url).pathname, filename = path.join(process.cwd(), uri);
            var contentTypesByExtension = {
                '.tar.gz': "application/gzip",
                '.js.gz': "application/gzip",
                ',js.gzip':	"application/gzip",
                '.js.zip':	"application/gzip"
            };
            var contentType = contentTypesByExtension[path.extname(filename)];
            if(contentType == "application/gzip")
            { 
                response.header('Content-Encoding' , 'gzip' );
            }
            next();
    });

    var fwFilePath = '/home/pi/ac30web/drivefw/';
    app.use(bodyParser.json());
    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, fwFilePath)
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.originalname)
        }
    });

    var upload = multer({ storage: storage });

    var devPath = '/studioexport';
    //devPath = '/public';
    app.use(express.static(__dirname + devPath));                 // set the static files location /public/img will be /img for users

    app.set('http_port', HTTP_PORT);
       
	var options = {
		key: fs.readFileSync('server.key'),
		cert: fs.readFileSync('server.crt')
	}
	
    var httpServer = http.createServer(app).listen(app.get('http_port'), function(){
        console.log('Express server listening on port ' + app.get('http_port'));
    });

    sockSvc.sockServer.installHandlers(httpServer, {prefix: '/data'});

    app.post('/multer', upload.single('file'), function(req,res,next){
        res.sendStatus(200);
        console.log('Upload Successful ', req.file, req.body);
    });

    app.get('/codesys/:action', function(req, res) {
        var action = req.params.action;
        console.log("Codesys Process " + action);
        res.sendStatus(200);
        exec('sudo /etc/init.d/codesyscontrol ' + action, puts);
    });
    
    app.get('/console/:action', function(req, res) {
        var action = req.params.action;
        console.log("Console Command " + action);
        res.sendStatus(200);
        exec(action, puts);
        //exec('sudo ' + action, puts);
    });
    
    app.get('/identify/:macid', function(req, res) {
        var macid = req.params.macid;
        console.log("Identify " + macid);
        res.sendStatus(200);
        dctSvc.IdentifyDrive(macid);
    });

    function puts(error, stdout, stderr) { 
        sys.puts(stdout); 
        sockSvc.SendWebSocketMessage("console",stdout);
    };

    app.get('/DCTScan', function(req, res) {
        console.log("DCT Scan");
        dctSvc.DctDriveScan();
        res.sendStatus(200);
    });

    var driveaddresslookup = {
       table: []
    };

    app.get('/savedriveipaddresslookup', function(req, res) {
        console.log("Save Drive IpAddresses");
        
        for (i=0; i<5 ; i++){
        driveaddresslookup.table.push({id: i, square:i*i});
        }
        var json = JSON.stringify(driveaddresslookup); 
        fs.writeFile('myjsonfile.json', json); 
        res.sendStatus(200);
    });
    
    app.get('/GetFwFiles', function(req, res) {
        try
        {   
            GetFwFiles();
            res.sendStatus(200);
        }
        catch(err)
        {}        
    });

    app.get('/writeFileToDrive/:filename/:ipaddress', function(req, res) {
        try
        {
            var file = req.params.filename;
            var ipaddress = req.params.ipaddress;
            console.log("Upload " + file + " to drive " + ipaddress);
            writeBinaryPostData(ipaddress, fwFilePath, file)
        }
        catch(err)
        {}
    });

    app.get('/GetHostIpAddress', function(req, res) {
        try
        {
            console.log("Host IpAddress : " + HOST);
            res.send(HOST);
        }
        catch(err)
        {}  
    });

    app.get('/delete/:id', function(req, res) {
        try
        {
            console.log("Going to delete an existing file");
            var file = fwFilePath + req.params.id;
            fs.unlink(file, function(err) {
                if (err) {
                    return console.error(err);
                }
                console.log("File "+ file + " deleted successfully!");
                res.sendStatus(200);
            });
            GetFwFiles();
        }
        catch(err)
        {}  
    });


function GetFwFiles() {
    var folder = '/home/pi/ac30web/drivefw/';
    readFiles(folder, function(file) {
        sockSvc.SendWebSocketMessage("file",file);
    }, function(err) {
    //throw err;
    });
}

function writeBinaryPostData(ipaddress, folder, file) {
    console.log(folder + file);
    data = fs.readFileSync(folder + file);
    var options = {
        host: ipaddress,
        port: 8080,
        path: '/',
        method: 'POST'
    };

    var req;
    try
    {
        req = http.request(options, function(res)
        {
            res.setEncoding('utf8');
            res.on('response', function (chunk) {
                console.log("body: " + chunk);
            });
        });

        var crlf = "\r\n",
            boundaryKey = Math.random().toString(16),
            boundary = "--${boundaryKey}",
            delimeter = "${crlf}--${boundary}",
            headers = [
            'Content-Disposition: form-data; name="file"; filename="' + file + '"' + crlf
            ],
            closeDelimeter = '${delimeter}--';


        var multipartBody = Buffer.concat([
            new Buffer(delimeter + crlf + headers.join('') + crlf),
            data,
            new Buffer(closeDelimeter)]
        );
        req.setHeader('Unix-Date', Math.floor(Date.now() /1000));
        req.setHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
        req.setHeader('Content-Length', multipartBody.length);

        req.write(multipartBody);
    }
    catch(err)
    {

    }
    if(req != undefined)
    {
        req.end();
    }
}

function readFiles(dirname, onFileContent, onError) {
    try
    {
        fs.readdir(dirname, function(err, filenames) {
            if (err) {
                onError(err);
                return;
            }
            filenames.forEach(function(filename) {
                var stats = fs.statSync(dirname + filename)
                var fileSizeInBytes = stats["size"]
                var fileSizeInMegabytes = Math.round(fileSizeInBytes / 1024);
                fs.readFile(dirname + filename, 'utf-8', function(err, content) {
                    if (err) {
                        onError(err);
                        return;
                    }
                    var file = {};
                    file.Name = filename;
                    file.Folder = dirname;
                    file.FileSize = fileSizeInBytes;
                    file.FileSizeMb = fileSizeInMegabytes;
                    onFileContent(file);
                });
            });
        });
    }
    catch(err)
    {}  

}

function GetLocalEth0IpAddress()
{
    var os = require('os');
    var interfaces = os.networkInterfaces();
    var addresses = [];
    for (var k in interfaces) {
        console.log(k);
        if(k=='eth0')
        //if(k=='wlan0')
        {
            for (var k2 in interfaces[k]) {
		console.log(k2);
                var address = interfaces[k][k2];
                if (address.family === 'IPv4' && !address.internal) {
                    addresses.push(address.address);
                }
            }
        }
    }
    dctSvc.init(addresses[0]);
    console.log("Local IpAddress " + addresses[0])
    return addresses[0];
}

