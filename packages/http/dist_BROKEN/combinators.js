"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequenceValidation = exports.sequenceOption = void 0;
const O = require("fp-ts/Option");
const Apply_1 = require("fp-ts/Apply");
const NonEmptyArray_1 = require("fp-ts/NonEmptyArray");
const Either_1 = require("fp-ts/Either");
exports.sequenceOption = Apply_1.sequenceT(O.Apply);
exports.sequenceValidation = Apply_1.sequenceT(Either_1.getApplicativeValidation(NonEmptyArray_1.getSemigroup()));
