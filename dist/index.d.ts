/// <reference types="node" />
import { AsyncFn, Callback, Fn } from "@bcg-ts/ts-toolkit";
import { OutgoingHttpHeaders, IncomingHttpHeaders } from "http";
export declare const enum HttpStatus {
    OK = 200,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    ERROR = 500
}
export declare const enum HttpMethod {
    DELETE = "DELETE",
    GET = "GET",
    OPTIONS = "OPTIONS",
    POST = "POST",
    PUT = "PUT"
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
export declare type RouteHandler = Fn<IHttpRequest, IHttpResponse>;
export declare type AsyncRouteHandler = AsyncFn<IHttpRequest, IHttpResponse>;
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
export declare const startServer: (config: IServerConfig) => import("http").Server;
