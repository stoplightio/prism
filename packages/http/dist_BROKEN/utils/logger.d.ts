/// <reference types="pino" />
import { IPrismDiagnostic } from '@stoplight/prism-core';
export declare const violationLogger: import("fp-ts/lib/Reader").Reader<import("pino").Logger, (violation: IPrismDiagnostic) => void>;
