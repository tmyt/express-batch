"use strict";

const FakeRequest = require('./lib/FakeRequest')
    , FakeResponse = require('./lib/FakeResponse');

const ReadableStreamBuffer = require('stream-buffers').ReadableStreamBuffer;

function mergeHeaders(headers1, headers2){
  const ret = {};
  for(const k in headers1){
    ret[k.toLowerCase()] = headers1[k];
  }
  for(const k in headers2){
    if(!headers2[k]) continue;
    ret[k.toLowerCase()] = headers2[k];
  }
  return ret;
}

function finalHandler(fakeRes) {
  return function (err) {
    if (err) {
      return fakeRes.sendStatus(500);
    }
    fakeRes.sendStatus(404);
  };
}

function processRequests(app, req, res, body, options){
  if(!body || !body.requests){
    return res.sendStatus(400);
  }

  const results = [];
  const requests = body.requests;
  const requestCount = requests.length;
  let finishedRequests = 0;

  if (requestCount === 0) {
    return res.json(results);
  }

  for(let i = 0; i < requests.length; ++i){
    results[i] = {};

    const request = requests[i];
    const fakeReq = new FakeRequest(request.uri, mergeHeaders(req.headers, request.headers || {}));
    const fakeRes = new FakeResponse(results[i], options);
    fakeReq.method = request.method;
    if(fakeReq.method === 'POST'){
      fakeReq.put(Buffer.from(request.body));
      fakeReq.stop();
    }else{
      delete fakeReq.headers['Content-Length'];
      delete fakeReq.headers['Content-Type'];
    }

    fakeRes.once('end', done);

    app(fakeReq, fakeRes, finalHandler(fakeRes));
  }

  function done() {
    if (++finishedRequests >= requestCount) {
      res.jsonp({responses: results});
    }
  }
}

module.exports = function expressBatch(app, options) {

  options = options || {};

  return function (req, res) {
    if(req.method !== 'POST'){
      return res.sendStatus(400);
    }
    if(req.headers['content-type'] !== 'application/json'){
      return res.sendStatus(400);
    }
    if(!req.body){
      let data = '';
      req.on('data', chunk => {
        data += chunk.toString();
      });
      req.on('end', () => {
        processRequests(app, req, res, JSON.parse(data), options);
      });
    }else{
      processRequests(app, req, res, req.body, options);
    }
  };
};
