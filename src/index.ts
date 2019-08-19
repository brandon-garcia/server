import {AsyncFn, Callback, Fn, Pipeline, TypeUtils} from "@bcg-ts/ts-toolkit";
import {
  RequestListener,
  IncomingMessage,
  ServerResponse,
  OutgoingHttpHeaders,
  IncomingHttpHeaders, createServer
} from "http";

export const enum HttpStatus {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  ERROR = 500,
}

export const enum HttpMethod {
  DELETE = "DELETE",
  GET = "GET",
  OPTIONS = "OPTIONS",
  POST = "POST",
  PUT = "PUT",
}

export interface IHttpMessage {
  data?: string;
}

export interface IHttpRequest extends IHttpMessage {
  headers: IncomingHttpHeaders;
  url: string;
  method: HttpMethod;
}

export interface IHttpResponse extends IHttpMessage {
  headers: OutgoingHttpHeaders;
  status?: HttpStatus;
  encoding?: string;
}

export type RouteHandler = Fn<IHttpRequest, IHttpResponse>;
export type AsyncRouteHandler = AsyncFn<IHttpRequest, IHttpResponse>;

export interface IHttpRoute {
  url: string;
  method: HttpMethod;
}

export interface IHttpRouteConfig extends IHttpRoute {
  handler: AsyncRouteHandler | RouteHandler;
}

export interface IServerConfig {
  routes: IHttpRouteConfig[];
  port: number;
  onListen: Callback;
}

export interface IHttpError extends Error {
  httpResponse: IHttpResponse;
}

const hasRouteInfo = <T extends object> (maybeRoute: T): maybeRoute is T & IHttpRoute => (
  TypeUtils.field(maybeRoute, "method", TypeUtils.nonEmptyString) &&
  TypeUtils.field(maybeRoute, "url", TypeUtils.nonEmptyString)
);

const getRouteId = (route: IHttpRoute) => `${route.method}:${route.url}`;

const sendResponse =  (serverResponse: ServerResponse, responseOrStatus?: number | IHttpResponse) => {
  if (TypeUtils.nonNull(responseOrStatus) && TypeUtils.object(responseOrStatus)) {
    serverResponse.writeHead(responseOrStatus.status || HttpStatus.OK, responseOrStatus.headers);
    if (TypeUtils.object(responseOrStatus) && responseOrStatus.data) {
      serverResponse.end(responseOrStatus.data, responseOrStatus.encoding || "utf-8");
    }
  } else {
    serverResponse.writeHead(responseOrStatus || HttpStatus.OK);
  }
};

const readRequestData = (message: IncomingMessage): Promise<string> => {
  return new Promise((resolve) => {
    let bodyStr = '';

    message.on('data', (chunk) => {
      bodyStr += chunk.toString();
    });

    message.on('end', () => {
      resolve(bodyStr);
    });
  });
};

const readRequest = (message: IncomingMessage & Record<"method"|"url", string>): IHttpRequest => ({
  headers: message.headers,
  method: message.method as HttpMethod,
  url: message.url,
});

const marshallIncoming = async (message: IncomingMessage & Record<"method"|"url", string>): Promise<IHttpRequest> => {
  if (message.method === HttpMethod.POST || message.method === HttpMethod.PUT) {
    return {
      ...readRequest(message),
      data: await readRequestData(message),
    };
  }
  return readRequest(message);
};

const compileRouteConfig = (routes: IHttpRouteConfig[]) => {
  const router: Record<string, IHttpRouteConfig> = {};
  for (let route of routes) {
    router[ getRouteId(route) ] = route;
  }
  return router;
};

const getResponseSender = (serverResponse: ServerResponse) =>
  (response: IHttpResponse|HttpStatus) => sendResponse(serverResponse, response);

const createRequestListener = (router: Record<string, IHttpRouteConfig>): RequestListener =>
  (serverRequest, serverResponse) => {
    const sender = getResponseSender(serverResponse);
    try {
      if (hasRouteInfo(serverRequest)) {
        const routeId = getRouteId(serverRequest);
        if (routeId in router) {
          marshallIncoming(serverRequest)
            .then(router[routeId].handler)
            .then(sender);
        } else {
          sender(HttpStatus.NOT_FOUND);
        }
      } else {
        sender(HttpStatus.BAD_REQUEST);
      }
    } catch (err) {
      if ("httpResponse" in err) {
        sender(err.httpResponse);
      } else {
        sender(HttpStatus.ERROR);
      }
    }
  };

export const startServer = (config: IServerConfig) => (
  Pipeline.identity<IHttpRouteConfig[]>()
    .map(compileRouteConfig)
    .map(createRequestListener)
    .map(createServer)
    .alsoDo((server) => server.listen(config.port, config.onListen))
    .callable(config.routes)
);

