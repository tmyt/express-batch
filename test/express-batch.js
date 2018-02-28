"use strict";

var should = require("should");
var request = require("supertest");
var express = require("express");
var expressBatch = require("..");

describe("express-batch as a module", function () {
    it("should provide function, which returns middleware function", function () {
        var app = express();
        should(expressBatch).be.a.Function;

        should(expressBatch(app)).be.a.Function;
    });
});

describe("request to route for express-batch", function () {

    var app;

    beforeEach(function createApp() {
        app = express();
        app.use("/api/batch", expressBatch(app));
    });

    describe("post empty object", function () {
        it("should return 400 response", function (done) {
            request(app)
                .post("/api/batch")
                .expect({ })
                .expect(400, done);
        });
    });

    describe("content-type is not application/json", function () {
        it("should return 400 response", function (done) {
            request(app)
                .post("/api/batch")
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({requests:[]})
                .expect({ })
                .expect(400, done);
        });
    });


    describe("without any api endpoint specified", function () {
        it("should return empty object", function (done) {
            request(app)
                .post("/api/batch")
                .set('Content-Type', 'application/json')
                .send({requests:[]})
                .expect({ })
                .expect(200, done);
        });
    });

    describe("with invalid endpoint specified", function () {
        it("should indicate 'not found' status in result", function (done) {
            request(app)
                .post("/api/batch")
                .set('Content-Type', 'application/json')
                .send({requests:[{'method': 'GET', 'uri': '/wrong/path'}]})
                .expect({ responses: [ {
                    status: 404,
                    result: "Not Found"
                 } ] })
                .expect(200, done);
        });
    });

    describe("with request to endpoint handler with async exception", function () {
        it("should handle exception and return status 500 in result", function (done) {

            app.get("/api/exception/sync", function (req, res) {
                throw new Error('sync exception');
            });

            request(app)
                .post("/api/batch")
                .set('Content-Type', 'application/json')
                .send({requests:[{'method': 'GET', 'uri': '/api/exception/sync'}]})
                .expect({
                    responses: [{
                        status: 500,
                        result: "Internal Server Error"
                    }]
                })
                .expect(200, done);
        });
    });

    describe.skip("with request to endpoint handler with async exception", function () {
        it("should handle exception and return status 500 in result", function (done) {

            app.get("/api/exception/async", function (req, res) {
                setImmediate(function asyncException() {
                    throw new Error('async exception');
                });

            });

            request(app)
                .post("/api/batch")
                .set('Content-Type', 'application/json')
                .send({requests:[{'method': 'GET', 'uri': '/api/exception/async'}]})
                .expect({
                    responses:[ {
                        status: 500
                    }]
                })
                .expect(200, done);
        });
    });

    describe("with specified path to endpoint, which uses res.json", function () {
        it("should return result and status for this endpoint", function (done) {
            app.get("/api/user", function apiUserHandler(req, res) {
                res.json({
                    id: 17
                });
            });

            request(app)
                .post("/api/batch")
                .set('Content-Type', 'application/json')
                .send({requests:[{'method': 'GET', 'uri': '/api/user'}]})
                .expect({
                    responses: [{
                        status: 200,
                        result: {
                            id: 17
                        }
                    }]
                })
                .expect(200, done);
        });
    });

    describe("with specified path to endpoint, which uses res.jsonp", function () {
        it("should return result and status for this endpoint", function (done) {
            app.get("/api/user", function apiUserHandler(req, res) {
                res.jsonp({
                    id: 2
                });
            });

            request(app)
                .post("/api/batch")
                .set('Content-Type', 'application/json')
                .send({requests:[{'method': 'GET', 'uri': '/api/user'}]})
                .expect({
                    responses: [{
                        status: 200,
                        result: {
                            id: 2
                        }
                    }]
                })
                .expect(200, done);
        });
    });

    describe("with specified path to endpoint, which uses res.send method", function () {
        it("should return result and status for this endpoint", function (done) {
            app.get("/api/timestamp", function apiTimestampHandler(req, res) {
                res.send(556984800);
            });

            request(app)
                .post("/api/batch")
                .set('Content-Type', 'application/json')
                .send({requests:[{'method': 'GET', 'uri': '/api/timestamp'}]})
                .expect({
                    responses: [{
                        status: 200,
                        result: 556984800
                    }]
                })
                .expect(200, done);
        });
    });

    describe("with specified path to endpoint, which uses res.end method", function () {
        it("should return result and status for this endpoint", function (done) {
            app.get("/api/timestamp", function apiTimestampHandler(req, res) {
                res.end(556984800);
            });

            request(app)
                .post("/api/batch")
                .set('Content-Type', 'application/json')
                .send({requests:[{'method': 'GET', 'uri': '/api/timestamp'}]})
                .expect({
                    responses: [{
                        status: 200,
                        result: 556984800
                    }]
                })
                .expect(200, done);
        });
    });

    describe("with specified path to endpoint, which uses res.sendFile method", function () {
        it("should return error status for this endpoint since it isn't supported", function (done) {
            app.get("/api/file", function apiFileHandler(req, res) {
                res.sendFile(__filename);
            });

            request(app)
                .post("/api/batch")
                .set('Content-Type', 'application/json')
                .send({requests:[{'method': 'GET', 'uri': '/api/file'}]})
                .expect({
                    responses: [{
                        status: 501,
                        result: "Not Implemented"
                    }]
                })
                .expect(200, done);
        });
    });

    describe("with specified path to endpoint, uses res.status and res.end methods", function () {
        it("should return only status for this endpoint", function (done) {
            app.get("/api/timestamp", function apiTimestampHandler(req, res) {
                res.status(403).end();
            });

            request(app)
                .post("/api/batch")
                .set('Content-Type', 'application/json')
                .send({requests:[{'method': 'GET', 'uri': '/api/timestamp'}]})
                .expect({
                    responses: [{
                        status: 403
                    }]
                })
                .expect(200, done);
        });
    });

    describe("with specified path to endpoint, which specified status only via res.sendStatus using", function () {
        it("should return only status for this endpoint", function (done) {
            app.get("/api/timestamp", function apiTimestampHandler(req, res) {
                res.sendStatus(403);
            });

            request(app)
                .post("/api/batch")
                .set('Content-Type', 'application/json')
                .send({requests:[{'method': 'GET', 'uri': '/api/timestamp'}]})
                .expect({
                    responses:[ {
                        status: 403,
                        result: "Forbidden"
                    }]
                })
                .expect(200, done);
        });
    });

    describe("with specified path to endpoint, which used headers from request", function () {
        it("should return only status for this endpoint", function (done) {
            app.get("/api/user/:id", function apiUserHandler(req, res) {
                res.json({
                    id: req.params.id,
                    token: req.headers.token
                });
            });

            request(app)
                .post("/api/batch")
                .set('token', 'secretToken')
                .set('Content-Type', 'application/json')
                .send({requests:[{'method': 'GET', 'uri': '/api/user/457'}]})
                .expect({
                    responses:[ {
                        status: 200,
                        result: {
                            id: 457,
                            token: 'secretToken'
                        }
                    }]
                })
                .expect(200, done);
        });
    });

    describe("with specified path to endpoint without leading slash", function () {
        it("should return result for this endpoint anyway", function (done) {
            app.get("/api/user", function apiUserHandler(req, res) {
                res.json({
                    id: 41
                });
            });

            request(app)
                .post("/api/batch")
                .set('Content-Type', 'application/json')
                .send({requests:[{'method': 'GET', 'uri': 'api/user'}]})
                .expect({
                    responses: [{
                        status: 200,
                        result: {
                            id: 41
                        }
                    }]
                })
                .expect(200, done);
        });
    });


    describe("with two endpoints specified", function () {
        it("should return results for both endpoints", function (done) {
            app
                .get("/api/president/:id", function apiPresidentHandler(req, res) {
                    res.json({
                        id: 44,
                        name: 'Barack'
                    });
                })
                .get("/api/weather/:city/:timestamp", function apiWeatherHandler(req, res) {
                    res.json({
                        city: 'Kyiv',
                        timestamp: 1416337310,
                        temperature: -2,
                        unit: '°C'
                    });
                });

            request(app)
                .post("/api/batch")
                .set('Content-Type', 'application/json')
                .send({requests:[{'method': 'GET', 'uri': 'api/president/44'}, {'method': 'GET', 'uri': '/api/weather/kyiv/1416337310'}]})
                .expect({
                    responses: [{
                        status: 200,
                        result: {
                            id: 44,
                            name: 'Barack'
                        }
                    },
                    {
                        status: 200,
                        result: {
                            city: 'Kyiv',
                            timestamp: 1416337310,
                            temperature: -2,
                            unit: '°C'
                        }
                    }]
                })
                .expect(200, done);
        });
    });

    describe("with three endpoints specified, when one of them not found", function () {
        it("should return results for two endpoints and status for not existent", function (done) {
            app
                .get("/api/constants/pi", function apiHandler(req, res) {
                    res.send(Math.PI);
                })
                .get("/api/constants/e", function apiHandler(req, res) {
                    res.send(Math.E);
                });

            request(app)
                .post("/api/batch")
                .set('Content-Type', 'application/json')
                .send({requests:[{'method': 'GET', 'uri': '/api/constants/e'}, {'method': 'GET', 'uri': '/api/constants/pi'}, {'method': 'GET', 'uri': '/api/constants/mendelson'}]})
                .expect({
                    responses: [{
                        status: 200,
                        result: Math.E
                    },
                    {
                        status: 200,
                        result: Math.PI
                    },
                    {
                        status: 404,
                        result: "Not Found"
                    }]
                })
                .expect(200, done);
        });
    });

    describe("with two endpoints specified, with a nested series of field-value pairs using an optional separator", function () {

        beforeEach(function () {
            var options = {
                separator: ';'
            };
            app.use("/api/batchNested", expressBatch(app, options));
        });

        it("should return results for two endpoints with nested field-value pairs", function (done) {

            app
                .get("/api/climate/", function apiClimateHandler(req, res) {
                    var response = {
                        sunny: false,
                        warm: false
                    };
                    if (req.query.sunny === 'true' && req.query.warm === 'true') {
                        response.sunny = true;
                        response.warm = true;
                    }
                    res.json(response);
                })
                .get("/api/topography/", function apiTopographyHandler(req, res) {
                    var response = {
                        hilly: true,
                        rocky: true
                    };
                    if (req.query.hilly === 'false' && req.query.rocky === 'false') {
                        response.hilly = false;
                        response.rocky = false;
                    }
                    res.json(response);
                });

            request(app)
                .post("/api/batch")
                .set('Content-Type', 'application/json')
                .send({requests:[{'method': 'GET', 'uri': '/api/climate/?sunny=true&warm=true'}, {'method': 'GET', 'uri': '/api/topography/?hilly=false&rocky=false'}]})
                .expect({
                    responses: [{
                        status: 200,
                        result: {
                            sunny: true,
                            warm: true
                        }
                    },
                    {
                        status: 200,
                        result: {
                            hilly: false,
                            rocky: false
                        }
                    }]
                })
                .expect(200, done);
        });
    });

    describe("with activated headers passing", function () {

        beforeEach(function () {
            var options = {
                returnHeaders: true
            };
            app.use("/api/batchWithHeaders", expressBatch(app, options));
        });


        it("should provide headers field in results", function (done) {
            app
                .get("/api/constants/pi", function apiHandler(req, res) {
                    res.send(Math.PI);
                });

            request(app)
                .post("/api/batchWithHeaders")
                .set('Content-Type', 'application/json')
                .send({requests:[{'method': 'GET', 'uri': '/api/constants/pi'}]})
                .expect({
                    responses: [{
                        status: 200,
                        result: Math.PI,
                        headers: {
                            "X-Powered-By": "Express"
                        }
                    }]
                })
                .expect(200, done);
        });
        it("should return headers from handlers which specified them", function (done) {
            app
                .get("/api/constants/pi", function apiHandler(req, res) {
                    res.setHeader('token', 124);
                    res.send(Math.PI);
                })
                .get("/api/constants/e", function apiHandler(req, res) {
                    res.send(Math.E);
                });

            request(app)
                .post('/api/batchWithHeaders')
                .set('Content-Type', 'application/json')
                .send({requests: [{'method': 'GET', 'uri': '/api/constants/e'}, {'method': 'GET', 'uri': '/api/constants/pi'}, {'method': 'GET', 'uri': '/api/constants/mendelson'}]})
                .expect({
                    responses: [{
                        status: 200,
                        result: Math.E,
                        // @FIXME strict checking of content of "headers" (equality to exact object) seems redundant
                        // @FIXME probably only existence of "headers" should be checked
                        headers: {
                            "X-Powered-By": "Express"
                        }
                    },
                    {
                        status: 200,
                        result: Math.PI,
                        headers: {
                            "X-Powered-By": "Express",
                            token: 124
                        }
                    },
                    {
                        status: 404,
                        result: "Not Found",
                        headers: {
                            "X-Powered-By": "Express",
                            "Content-Type": "text/plain; charset=utf-8"
                        }
                    }]
                })
                .expect(200, done);
        });
    });
});
