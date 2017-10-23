var terminals = {},
    logs = {};

var express = require('express');
var myApp = express();
var expressWs = require('express-ws')(myApp);
var os = require('os');
var pty = require('node-pty');

myApp.use(function (req,res,next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  next();
});

myApp.post('/ewd-vista/vista-terminal', function(req, res) {
  if (req.params.m == 'cache') {
    term = pty.spawn('csession', [req.params.instance, req.params.namespace, 'ZU'], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.env.PWD,
      env: process.env
    });
  }
  else { // GTM
    term = pty.spawn('mumps', ['-run', 'ZU'], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.env.PWD,
      env: process.env
    });
  }
  console.log('Created terminal with PID: ' + term.pid);
  terminals[term.pid] = term;
  logs[term.pid] = '';
  term.on('data', function(data) {
    logs[term.pid] += data;
  });
  res.send(term.pid.toString());
  res.end();
});

 
myApp.post('/ewd-vista/vista-terminal/:pid/size', function (req, res) {
  var pid = parseInt(req.params.pid),
      cols = parseInt(req.query.cols),
      rows = parseInt(req.query.rows),
      term = terminals[pid];

  term.resize(cols, rows);
  console.log('Resized terminal ' + pid + ' to ' + cols + ' cols and ' + rows + ' rows.');
  res.end();
});

myApp.ws('/ewd-vista/vista-terminal/:pid', function (ws, req) {
  var term = terminals[parseInt(req.params.pid)];
  console.log('Connected to terminal ' + term.pid);
  ws.send(logs[term.pid]);

  term.on('data', function(data) {
    try {
      ws.send(data);
    } catch (ex) {
      // The WebSocket is not open, ignore
    }
  });
  term.on('close', function(data) {
    console.log('Process terminated...' + term.pid);
    ws.send('\r\nProcess terminated...' + term.pid);
    term.kill();
    delete terminals[term.pid];
    delete logs[term.pid];
  });
  ws.on('message', function(msg) {
    term.write(msg);
  });
  ws.on('close', function () {
    term.kill();
    console.log('Closed terminal ' + term.pid);
    // Clean things up
    delete terminals[term.pid];
    delete logs[term.pid];
  });
});

myApp.listen(8081);
console.log("listening at 8081");
