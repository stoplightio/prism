import { Languages } from '../../graph/nodes/types';
export declare const languageMap: {
    md: Languages;
    yml: Languages;
    js: Languages;
    json: Languages;
};
export declare function filenameToLanguage(fileName: string): string;
