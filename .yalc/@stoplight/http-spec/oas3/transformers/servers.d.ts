import { IServer } from '@stoplight/types';
import { ServerObject } from 'openapi3-ts';
export declare function translateToServers(servers: ServerObject[] | undefined): IServer[];
