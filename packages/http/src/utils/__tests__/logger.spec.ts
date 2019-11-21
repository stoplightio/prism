import { DiagnosticSeverity } from '@stoplight/types';

import { logBody, logHeaders, logRequest, logResponse, violationLogger } from '../logger';

const logger: any = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

describe('violationLogger()', () => {
  beforeEach(() => jest.clearAllMocks());

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

describe('logBody()', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('when valid body supplied', () => {
    it('logs with debug level', () => {
      logBody({ logger, body: 'Oh dear, I am not an real object :(' });
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Oh dear, I am not an real object :('));
    });
  });

  describe('when invalid body supplied', () => {
    it('logs nothing', () => {
      const body = { x: {} };
      body.x = { y: body };
      logBody({ logger, body });
      expect(logger.debug).not.toHaveBeenCalled();
    });
  });
});

describe('logHeaders()', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('when headers are supplied as array of string pairs', () => {
    it('logs', () => {
      logHeaders({ logger, headers: [['a', '1'], ['b', '2']] });
      expect(logger.debug).toHaveBeenNthCalledWith(1, expect.stringContaining('Headers'));
      expect(logger.debug).toHaveBeenNthCalledWith(2, expect.stringContaining('a: 1'));
      expect(logger.debug).toHaveBeenNthCalledWith(3, expect.stringContaining('b: 2'));
    });
  });

  describe('when headers are supplied as an object', () => {
    it('logs', () => {
      logHeaders({ logger, headers: { a: '1', b: '2' } });
      expect(logger.debug).toHaveBeenNthCalledWith(1, expect.stringContaining('Headers'));
      expect(logger.debug).toHaveBeenNthCalledWith(2, expect.stringContaining('a: 1'));
      expect(logger.debug).toHaveBeenNthCalledWith(3, expect.stringContaining('b: 2'));
    });
  });
});

describe('logRequest()', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('when both body and headers are supplied', () => {
    it('logs', () => {
      logRequest({ logger, prefix: 'The ', body: 'of an American', headers: { the: 'Pogues' } });
      expect(logger.debug).toHaveBeenNthCalledWith(1, expect.stringMatching(/The .*Headers:/));
      expect(logger.debug).toHaveBeenNthCalledWith(2, expect.stringContaining('the: Pogues'));
      expect(logger.debug).toHaveBeenNthCalledWith(3, expect.stringMatching(/The .*Body:.* of an American/));
    });
  });

  describe('when both body and headers are not supplied', () => {
    it('stays silent', () => {
      logRequest({ logger });
      expect(logger.debug).not.toHaveBeenCalled();
    });
  });
});

describe('logResponse()', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('when both body and headers are supplied', () => {
    it('logs', () => {
      logResponse({ logger, prefix: 'The ', body: 'of an American', headers: { the: 'Pogues' }, statusCode: 599 });
      expect(logger.debug).toHaveBeenNthCalledWith(1, expect.stringMatching(/The .*Status:.* 599/));
      expect(logger.debug).toHaveBeenNthCalledWith(2, expect.stringMatching(/The .*Headers:/));
      expect(logger.debug).toHaveBeenNthCalledWith(3, expect.stringContaining('the: Pogues'));
      expect(logger.debug).toHaveBeenNthCalledWith(4, expect.stringMatching(/The .*Body:.* of an American/));
    });
  });

  describe('when both body and headers are not supplied', () => {
    it('logs only statusCode', () => {
      logResponse({ logger, statusCode: 100 });
      expect(logger.debug).toHaveBeenNthCalledWith(1, expect.stringMatching(/Status:.* 100/));
    });
  });
});
