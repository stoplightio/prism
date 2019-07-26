import { IDisposable } from '@stoplight/lifecycle';
import { ISpecProvider } from '../types';
export declare class SpecProviderRegistry {
    private identifiersRegistry;
    register(identifier: ISpecProvider): IDisposable;
    provideByContent(parsed: any): string | undefined;
    provideByPath(path: string): string | undefined;
}
export declare const registry: SpecProviderRegistry;
