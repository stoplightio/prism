"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NO_SERVER_CONFIGURATION_PROVIDED_ERROR = exports.NO_METHOD_MATCHED_ERROR = exports.NO_SERVER_MATCHED_ERROR = exports.NO_PATH_MATCHED_ERROR = exports.NO_RESOURCE_PROVIDED_ERROR = exports.NO_BASE_URL_ERROR = void 0;
exports.NO_BASE_URL_ERROR = {
    title: 'Attempted to make a request to a server but neither baseUrl param provided nor servers defined in the spec',
    type: 'NO_BASE_URL_ERROR',
    status: 400,
};
exports.NO_RESOURCE_PROVIDED_ERROR = {
    title: 'Route not resolved, no resource provided',
    type: 'NO_RESOURCE_PROVIDED_ERROR',
    status: 404,
};
exports.NO_PATH_MATCHED_ERROR = {
    title: 'Route not resolved, no path matched',
    type: 'NO_PATH_MATCHED_ERROR',
    status: 404,
};
exports.NO_SERVER_MATCHED_ERROR = {
    title: 'Route not resolved, no server matched',
    type: 'NO_SERVER_MATCHED_ERROR',
    status: 404,
};
exports.NO_METHOD_MATCHED_ERROR = {
    title: 'Route resolved, but no method matched',
    type: 'NO_METHOD_MATCHED_ERROR',
    status: 405,
};
exports.NO_SERVER_CONFIGURATION_PROVIDED_ERROR = {
    title: 'Route not resolved, no server configuration provided',
    type: 'NO_SERVER_CONFIGURATION_PROVIDED_ERROR',
    status: 404,
};
