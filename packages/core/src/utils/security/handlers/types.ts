import { Dictionary } from '@stoplight/types';

type Headers = Dictionary<string, string>;

export type AuthResult = Partial<{ name: string; message: string; status: number; headers: Headers }>;
export type SecurityScheme = { type: string; name: string; in?: string; scheme?: string };
