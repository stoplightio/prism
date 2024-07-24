import * as $RefParser from '@stoplight/json-schema-ref-parser';
import { decycle } from '@stoplight/json';
import { get, camelCase, forOwn } from 'lodash';
import { JSONSchemaFaker } from 'json-schema-faker';
import type { JSONSchemaFakerOptions } from 'json-schema-faker';
import { resetJSONSchemaGenerator } from '@stoplight/prism-http';
import { JsonPath, Segment } from '@stoplight/types';

export async function configureExtensionsUserProvided(
  specFilePathOrObject: string | object,
  cliParamOptions: { [option: string]: any }
): Promise<void> {
  const result = decycle(await new $RefParser().dereference(specFilePathOrObject));

  resetJSONSchemaGenerator();

  forOwn(get(result, 'x-json-schema-faker', {}), (value: any, option: string) => {
    setFakerValue(option, value);
  });

  // cli parameter takes precidence, so it is set after spec extensions are configed
  for (const param in cliParamOptions) {
    if (cliParamOptions[param] !== undefined) {
      setFakerValue(param, cliParamOptions[param]);
    }
  }
}

function setFakerValue(option: string, value: any) {
  if (option === 'locale') {
    // necessary as workaround broken types in json-schema-faker
    // @ts-ignore
    return JSONSchemaFaker.locate('faker').setLocale(value);
  }
  // necessary as workaround broken types in json-schema-faker
  // @ts-ignore
  JSONSchemaFaker.option(camelCase(option) as keyof JSONSchemaFakerOptions, value);
}

// export function decycle(obj: unknown, replacer?: (value: any) => any) {
//   console.log('IN MY CODE DECYCLE FUNCTION');
//   const objs = new WeakMap<object, string>();
//   const processedObjs = new WeakSet<object>();
//   function derez(value: any, path: (string | number)[]): any {
//     if (replacer) {
//       value = replacer(value);
//     }
//     if (isPlainObject(value) || Array.isArray(value)) {
//       // The path of an earlier occurance of value
//       const oldPath = objs.get(value);
//       // If the value is an object or array, look to see if we have already // encountered it. If so, return a {"$ref":PATH} object.
//       if (oldPath) {
//         return { $ref: oldPath };
//       }
//       objs.set(value, pathToPointer(path));
//       // If it is an array, replicate the array.
//       if (Array.isArray(value)) {
//         return value.map((element, i) => derez(element, [...path, i]));
//       }
//       const newObj: Record<string, any> = {};
//       for (const name in value) {
//         if (Object.prototype.hasOwnProperty.call(value, name)) {
//           newObj[name] = derez(value[name], [...path, name]);
//         }
//       }
//       // Only delete the object from the map if it has not been processed before
//       if (!processedObjs.has(value)) {
//         objs.delete(value);
//       }
//       processedObjs.add(value);
//       return newObj;
//     }
//     return value;
//   }
//   return derez(obj, []);
// }

// export function isPlainObject(maybeObj: unknown): maybeObj is Record<PropertyKey, unknown> {
//   if (typeof maybeObj !== 'object' || maybeObj === null) {
//     return false;
//   }
//   const proto = Object.getPrototypeOf(maybeObj);
//   return (
//     proto === null ||
//     proto === Object.prototype ||
//     // this is to be more compatible with Lodash.isPlainObject that also checks the constructor
//     (typeof maybeObj.constructor === 'function' &&
//       Function.toString.call(Object) === Function.toString.call(maybeObj.constructor))
//   );
// }

// export const pathToPointer = (path: JsonPath): string => {
//   const encodeUriFragmentIdentifier = (path: JsonPath): string => {
//     if (path && typeof path !== 'object') {
//       throw new TypeError('Invalid type: path must be an array of segments.');
//     }
//     if (path.length === 0) {
//       return '#';
//     }
//     return `#/${path.map(encodePointerUriFragment).join('/')}`;
//   };

//   return encodeUriFragmentIdentifier(path);
// };

// export const encodePointerUriFragment = (value: Segment): Segment => {
//   const encoded = encodePointerFragment(value);
//   return typeof encoded === 'number' ? encoded : encodeUriPointer(encoded);
// };

// export const encodePointerFragment = (value: Segment): Segment => {
//   return typeof value === 'number' ? value : replaceInString(replaceInString(value, '~', '~0'), '/', '~1');
// };

// export const replaceInString = (str: string, find: string, repl: string): string => {
//   const orig = str.toString();
//   let res = '';
//   let rem = orig;
//   let beg = 0;
//   let end = rem.indexOf(find);
//   while (end > -1) {
//     res += orig.substring(beg, beg + end) + repl;
//     rem = rem.substring(end + find.length, rem.length);
//     beg += end + find.length;
//     end = rem.indexOf(find);
//   }
//   if (rem.length > 0) {
//     res += orig.substring(orig.length - rem.length, orig.length);
//   }
//   return res;
// };

// export function encodeUriPointer(pointer: string): string {
//   const ENCODABLE_CHAR = /[^a-zA–Z0–9_.!~*'()\/\-\u{D800}-\u{DFFF}]/gu;
//   return pointer.replace(ENCODABLE_CHAR, encodeURIComponent);
// }
