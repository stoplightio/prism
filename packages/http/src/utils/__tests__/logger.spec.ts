import { violationLogger } from '../logger';
import { DiagnosticSeverity } from '@stoplight/types';

describe('violationLogger', () => {
  const logger: any = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  };


  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('violation is an error', () => {
    it('logs error', () => {
      violationLogger(logger)({ severity: DiagnosticSeverity.Error, message: 'Test' });
      expect(logger.error).toHaveBeenCalledWith({ name: 'VALIDATOR' }, 'Violation: Test');
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  describe('violation is an warning', () => {
    it('logs warning', () => {
      violationLogger(logger)({ severity: DiagnosticSeverity.Warning, message: 'Test' });
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith({ name: 'VALIDATOR' }, 'Violation: Test');
      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  describe('violation is an info', () => {
    it('logs info', () => {
      violationLogger(logger)({ severity: DiagnosticSeverity.Information, message: 'Test' });
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith({ name: 'VALIDATOR' }, 'Violation: Test');
    });
  });

  describe('violation has path set', () => {
    it('logs error with path', () => {
      violationLogger(logger)({ severity: DiagnosticSeverity.Error, message: 'Test', path: ['a', 'b'] });
      expect(logger.error).toHaveBeenCalledWith({ name: 'VALIDATOR' }, 'Violation: a.b Test');
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });
  });
});
