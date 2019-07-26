import { IServer } from '@stoplight/types';
import { Operation, Spec } from 'swagger-schema-official';
export declare function translateToServers(spec: Partial<Spec>, operation: Partial<Operation>): IServer[];
