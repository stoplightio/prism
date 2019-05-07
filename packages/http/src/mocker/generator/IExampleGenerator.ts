// @todo S is Schema interface (not defined yet)
export interface IExampleGenerator<S = unknown> {
  generate(schema: S, mediaType: string): Promise<string>;
}
