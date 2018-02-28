"use strict";

const ReadableStreamBuffer = require('stream-buffers').ReadableStreamBuffer;

class FakeRequest extends ReadableStreamBuffer{
  constructor(path, headers){
    super();

    if (path.substr(0, 1) !== '/') {
        path = '/' + path;
    }

    this.url = path;
    this.method = 'GET';
    this.headers = headers;
  }
}
    
module.exports = FakeRequest;

