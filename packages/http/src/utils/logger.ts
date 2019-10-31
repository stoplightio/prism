import withLogger from '../withLogger';
import { DiagnosticSeverity } from '@stoplight/types';
import { IPrismDiagnostic } from '@stoplight/prism-core';

export const violationLogger = withLogger(logger => {
  return (violation: IPrismDiagnostic) => {
    const path = violation.path ? violation.path.join('.') + ' ' : '';
    const message = `Violation: ${path}${violation.message}`;
    if (violation.severity === DiagnosticSeverity.Error) {
      logger.error({ name: 'VALIDATOR' }, message);
    } else if (violation.severity === DiagnosticSeverity.Warning) {
      logger.warn({ name: 'VALIDATOR' }, message);
    } else {
      logger.info({ name: 'VALIDATOR' }, message);
    }
  };
});
