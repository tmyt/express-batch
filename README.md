express-batch-json
=============

The project forked from [express-batch](https://github.com/yarikos/express-batch).

## Description

Middleware for [Express 4.x](http://expressjs.com/4x/api.html) that allows for batched API requests.

It's attached as a handler for a particular route.

If you need to perform several different requests to one API simultaneously, you could combine them all together (in one querystring) and send only one request to the handler's route.

The handler parses requests, and then invokes the relevant handler for each request (the standard app router is used), collects all the responses and sends them back as a JSON object with sections for each response.

## Example

```js
// app init
var express = require("express");
var expressBatch = require("express-batch");
var app = express();

// mount batch middeleware
app.use("/api/batch", expressBatch(app));


// mount ordinary API endpoints
app.get("/api/constants/pi", function apiUserHandler(req, res) {
    res.send(Math.PI);
});

app.get("/api/users/:id", function apiUserHandler(req, res) {
    res.json({
        id: req.params.id,
        name: "Alice"
    });
});

// start the app
app.listen(3000);
```
[This example in code.](example)

With this example, a request to  `http://localhost:3000/api/batch with this JSON 

```js
{
    requests: [{
        'method': 'GET',
        'uri': '/api/users/49'
    },
    {
        'method': 'GET',
        'uri': 'api/constants/pi'
    },
    {
        'method': 'GET',
        'uri': '/not/existent/route'
    }]
}
```

will return:

```js
{
    responses: [ {
        result: {
            id: "49",
            name: "Alice"
        },
        status: 200
    },
    {
        result: 3.141592653589793,
        status: 200
    },
    {
        result: "Not Found",
        status: 404
    } ]
}
```

It is also possible to have nested field-value pairs by passing in an options argument with a custom separator property.

```js
// mount batch handler with optional separator for nested field-value pairs
var options = {
    separator: ';'
};
app.use("/api/batch", expressBatch(app, options));

// easily handle batched requests with deep field-value pairs
app.get("/api/climate/", function apiClimateHandler(req, res) {
    var response = {
        sunny: false,
        warm: false
    };

    // e.g., with a request path of 'api/batch?climate=/api/climate/?sunny=true&warm=true'
    if (req.query.sunny === 'true' && req.query.warm === 'true') {
        response.sunny = true;
        response.warm = true;
    }
    res.json(response);
});
```

## Limitations
* Tested only with Express 4
* Supports only routes for GET requests.
* Handlers which will bу used beyond the middleware, could use only these methods of response:
  - `res.json()`
  - `res.jsonp()`
  - `res.jsonp()`
  - `res.end()`
  - `res.status()`
  - `res.sendStatus()`
  - `res.sendStatus()`
  - `res.setHeader()`
  -  assign value to `res.statusCode` 
    
## Notes

There are similar packages, but which work using real http requests:
- [sonofabatch](https://www.npmjs.org/package/sonofabatch)   
- [batch-endpoint](https://www.npmjs.org/package/batch-endpoint)
- [express-batch-proxy](https://github.com/codastic/express-batch-proxy)


## Todo
- [x] Returning headers in batch results
- [ ] Add documentation about headers passing 
- [ ] Support of arrays (`batch?users=/api/users/1&users=/api/users/2` should return `users: [{id:1}, {id:2}]`)
- [ ] Support of rest of HTTP methods
- [ ] Support of rest of `response` methods
   
   
## License

  [MIT](LICENSE)

============= 
