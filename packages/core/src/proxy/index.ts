export const displayValidationWhenProxying = (inputValidations: any, outputValidations: any) => {
  if (inputValidations.length) {
    console.log('Input validations\n', inputValidations);
  }
  if (outputValidations.length) {
    console.log('Output validations\n', outputValidations);
  }
};

export const constructBaseUrl = (reqInput: any, config: any) => {
  if (config.upstream) {
    const { url, ...rest } = reqInput;
    const upstreamURL = new URL(config.upstream);
    const newUrl = Object.assign({}, url, { baseUrl: upstreamURL.protocol + '//' + upstreamURL.hostname });

    return { ...rest, url: newUrl };
  } else {
    return reqInput;
  }
};
