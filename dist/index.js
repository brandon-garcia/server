"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var ts_toolkit_1 = require("@bcg-ts/ts-toolkit");
var http_1 = require("http");
var hasRouteInfo = function (maybeRoute) { return (ts_toolkit_1.TypeUtils.field(maybeRoute, "method", ts_toolkit_1.TypeUtils.nonEmptyString) &&
    ts_toolkit_1.TypeUtils.field(maybeRoute, "url", ts_toolkit_1.TypeUtils.nonEmptyString)); };
var getRouteId = function (route) { return route.method + ":" + route.url; };
var sendResponse = function (serverResponse, responseOrStatus) {
    if (ts_toolkit_1.TypeUtils.nonNull(responseOrStatus) && ts_toolkit_1.TypeUtils.object(responseOrStatus)) {
        serverResponse.writeHead(responseOrStatus.status || 200, responseOrStatus.headers);
        if (ts_toolkit_1.TypeUtils.object(responseOrStatus) && responseOrStatus.data) {
            serverResponse.end(responseOrStatus.data, responseOrStatus.encoding || "utf-8");
        }
    }
    else {
        serverResponse.writeHead(responseOrStatus || 200);
    }
};
var readRequestData = function (message) {
    return new Promise(function (resolve) {
        var bodyStr = '';
        message.on('data', function (chunk) {
            bodyStr += chunk.toString();
        });
        message.on('end', function () {
            resolve(bodyStr);
        });
    });
};
var readRequest = function (message) { return ({
    headers: message.headers,
    method: message.method,
    url: message.url,
}); };
var marshallIncoming = function (message) { return __awaiter(_this, void 0, void 0, function () {
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (!(message.method === "POST" || message.method === "PUT")) return [3, 2];
                _a = [{}, readRequest(message)];
                _b = {};
                return [4, readRequestData(message)];
            case 1: return [2, __assign.apply(void 0, _a.concat([(_b.data = _c.sent(), _b)]))];
            case 2: return [2, readRequest(message)];
        }
    });
}); };
var compileRouteConfig = function (routes) {
    var router = {};
    for (var _i = 0, routes_1 = routes; _i < routes_1.length; _i++) {
        var route = routes_1[_i];
        router[getRouteId(route)] = route;
    }
    return router;
};
var getResponseSender = function (serverResponse) {
    return function (response) { return sendResponse(serverResponse, response); };
};
var createRequestListener = function (router) {
    return function (serverRequest, serverResponse) {
        var sender = getResponseSender(serverResponse);
        try {
            if (hasRouteInfo(serverRequest)) {
                var routeId = getRouteId(serverRequest);
                if (routeId in router) {
                    marshallIncoming(serverRequest)
                        .then(router[routeId].handler)
                        .then(sender);
                }
                else {
                    sender(404);
                }
            }
            else {
                sender(400);
            }
        }
        catch (err) {
            if ("httpResponse" in err) {
                sender(err.httpResponse);
            }
            else {
                sender(500);
            }
        }
    };
};
exports.startServer = function (config) { return (ts_toolkit_1.Pipeline.identity()
    .map(compileRouteConfig)
    .map(createRequestListener)
    .map(http_1.createServer)
    .alsoDo(function (server) { return server.listen(config.port, config.onListen); })
    .callable(config.routes)); };
//# sourceMappingURL=index.js.map