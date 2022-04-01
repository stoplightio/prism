"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentHasExamples = exports.createResponseFromDefault = exports.findResponseByStatusCode = exports.findFirstResponse = exports.findLowest2xx = exports.findDefaultContentType = exports.findBestHttpContentByMediaType = exports.findExampleByKey = exports.findFirstExample = void 0;
const accepts = require("accepts");
const contentType = require("content-type");
const O = require("fp-ts/Option");
const A = require("fp-ts/Array");
const N = require("fp-ts/number");
const NEA = require("fp-ts/NonEmptyArray");
const Ord_1 = require("fp-ts/Ord");
const function_1 = require("fp-ts/function");
const lodash_1 = require("lodash");
function findFirstExample(httpContent) {
    return function_1.pipe(O.fromNullable(httpContent.examples), O.chain(NEA.fromArray), O.chain(A.head));
}
exports.findFirstExample = findFirstExample;
function findExampleByKey(httpContent, exampleKey) {
    return function_1.pipe(O.fromNullable(httpContent.examples), O.chain(A.findFirst(({ key }) => key === exampleKey)));
}
exports.findExampleByKey = findExampleByKey;
function findBestHttpContentByMediaType(contents, mediaTypes) {
    const bestType = accepts({ headers: { accept: mediaTypes.join(',') } }).type(contents.map(c => c.mediaType));
    return function_1.pipe(bestType, O.fromPredicate((bestType) => !!bestType), O.chain(bestType => A.findFirst(content => content.mediaType === bestType)(contents)), O.alt(() => function_1.pipe(mediaTypes
        .map(mt => contentType.parse(mt))
        .filter(({ parameters }) => Object.keys(parameters).some(k => k !== 'q'))
        .map(({ type, parameters }) => ({ type, parameters: lodash_1.pick(parameters, 'q') }))
        .map(mt => contentType.format(mt)), NEA.fromArray, O.chain(mediaTypesWithNoParameters => findBestHttpContentByMediaType(contents, mediaTypesWithNoParameters)))));
}
exports.findBestHttpContentByMediaType = findBestHttpContentByMediaType;
function findDefaultContentType(contents) {
    return function_1.pipe(contents, A.findFirst(content => content.mediaType === '*/*'));
}
exports.findDefaultContentType = findDefaultContentType;
const byResponseCode = Ord_1.contramap((response) => parseInt(response.code))(N.Ord);
function findLowest2xx(httpResponses) {
    const first2xxResponse = function_1.pipe(httpResponses, A.filter(response => /2\d\d/.test(response.code)), A.sort(byResponseCode), A.head);
    return function_1.pipe(first2xxResponse, O.alt(() => createResponseFromDefault(httpResponses, 200)));
}
exports.findLowest2xx = findLowest2xx;
function findFirstResponse(httpResponses) {
    return function_1.pipe(httpResponses, A.head);
}
exports.findFirstResponse = findFirstResponse;
function findResponseByStatusCode(responses, statusCode) {
    return function_1.pipe(responses, A.findFirst(response => response.code.toLowerCase() === String(statusCode)));
}
exports.findResponseByStatusCode = findResponseByStatusCode;
function createResponseFromDefault(responses, statusCode) {
    return function_1.pipe(responses, A.findFirst(response => response.code === 'default'), O.map(response => Object.assign({}, response, { code: statusCode })));
}
exports.createResponseFromDefault = createResponseFromDefault;
function contentHasExamples(content) {
    return !!content.examples && content.examples.length !== 0;
}
exports.contentHasExamples = contentHasExamples;
