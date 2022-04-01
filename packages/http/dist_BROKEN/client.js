"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClientFromOperations = void 0;
const lodash_1 = require("lodash");
const querystring_1 = require("querystring");
const url_1 = require("url");
const _1 = require(".");
const TaskEither_1 = require("fp-ts/TaskEither");
const Task = require("fp-ts/Task");
const function_1 = require("fp-ts/function");
const pino = require("pino");
const logger = pino();
logger.success = logger.info;
function createClientFromOperations(resources, defaultConfig) {
    var _a;
    const finalLogger = (_a = defaultConfig.logger) !== null && _a !== void 0 ? _a : logger;
    const obj = _1.createInstance(defaultConfig, { logger: finalLogger });
    function isInput(input) {
        return !!input && 'headers' in input;
    }
    const client = {
        request(url, input, config) {
            const parsedUrl = url_1.parse(url);
            if (!parsedUrl.pathname)
                throw new Error('Path name must always be specified');
            const mergedConf = lodash_1.defaults(config, defaultConfig);
            const httpUrl = {
                baseUrl: parsedUrl.host ? `${parsedUrl.protocol}//${parsedUrl.host}` : mergedConf.baseUrl,
                path: parsedUrl.pathname,
                query: querystring_1.parse(parsedUrl.query || ''),
            };
            return function_1.pipe(obj.request({ ...input, url: httpUrl }, resources, mergedConf), TaskEither_1.fold(e => {
                throw e;
            }, data => Task.of({
                status: data.output.statusCode,
                headers: data.output.headers || {},
                data: data.output.body,
                config: mergedConf,
                request: { ...input, url: httpUrl },
                violations: data.validations,
            })))();
        },
        get(url, input, config) {
            return isInput(input)
                ? this.request(url, { method: 'get', ...input }, config)
                : this.request(url, { method: 'get' }, input);
        },
        put(url, body, input, config) {
            return isInput(input)
                ? this.request(url, { method: 'put', ...input, body }, config)
                : this.request(url, { method: 'put', body }, input);
        },
        post(url, body, input, config) {
            return isInput(input)
                ? this.request(url, { method: 'post', ...input, body }, config)
                : this.request(url, { method: 'post', body }, input);
        },
        delete(url, input, config) {
            return isInput(input)
                ? this.request(url, { method: 'delete', ...input }, config)
                : this.request(url, { method: 'delete' }, input);
        },
        options(url, input, config) {
            return isInput(input)
                ? this.request(url, { method: 'options', ...input }, config)
                : this.request(url, { method: 'options' }, input);
        },
        head(url, input, config) {
            return isInput(input)
                ? this.request(url, { method: 'head', ...input }, config)
                : this.request(url, { method: 'head' }, input);
        },
        patch(url, body, input, config) {
            return isInput(input)
                ? this.request(url, { method: 'patch', ...input, body }, config)
                : this.request(url, { method: 'patch', body }, input);
        },
        trace(url, input, config) {
            return isInput(input)
                ? this.request(url, { method: 'trace', ...input }, config)
                : this.request(url, { method: 'trace' }, input);
        },
    };
    return client;
}
exports.createClientFromOperations = createClientFromOperations;
