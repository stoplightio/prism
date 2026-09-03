export function createNegotiateAuth() {
  return async () => {
    throw new Error('Negotiate auth not supported in test environment');
  };
}
