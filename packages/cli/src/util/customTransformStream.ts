'use strict'

import { Transform, TransformCallback, TransformOptions } from 'stream'
import { StringDecoder } from 'string_decoder'

const kLast = Symbol('last')
const kDecoder = Symbol('decoder')

interface SplitStreamOptions extends TransformOptions {
  matcher?: RegExp | string
  mapper?: (input: string) => any
  maxLength?: number
  skipOverflow?: boolean
}

function transform(this: any, chunk: Buffer, enc: string, cb: TransformCallback): void {
  let decodedChunk = this[kDecoder].write(chunk); // Decode the chunk to a string
    
      // Accumulate the chunk in the last buffer
      this[kLast] += decodedChunk;
      
      try {
        // Try parsing the JSON data
        // Assuming the data is an array of JSON objects or newline-delimited JSON objects
        while (this[kLast]) {
          let obj;
          try {
            obj = JSON.parse(this[kLast]); // Try to parse the JSON
            this.push(obj); // Process the valid JSON object
            this[kLast] = ''; // Clear the accumulated data after processing
          } catch (error) {
            // If JSON is invalid, break out and wait for more data to accumulate
            break;
          }
        }
      } catch (error) {
        return cb(error as Error); // Return error through callback if an unexpected error occurs
      }

  this.overflow = this[kLast].length > this.maxLength
  if (this.overflow && !this.skipOverflow) {
    cb(new Error('maximum buffer reached'))
    return
  }
  cb()
}

function flush(this: any, cb: TransformCallback): void {
  // forward any gibberish left in there
  this[kLast] += this[kDecoder].end()

  if (this[kLast]) {
    try {
      push(this, this.mapper(this[kLast]))
    } catch (error) {
      return cb(error)
    }
  }

  cb()
}

function push(self: any, val: any): void {
  if (val !== undefined) {
    self.push(val)
  }
}

function noop(incoming: any): any {
  return incoming
}

function split(
  matcher: RegExp | string = /\r?\n/,
  mapper: (input: string) => any = noop,
  options: SplitStreamOptions = {}
): Transform {
  // Set defaults for any arguments not supplied.
  options = options || {}

  // Test arguments explicitly.
  switch (arguments.length) {
    case 1:
      // If mapper is only argument.
      if (typeof matcher === 'function') {
        mapper = matcher
        matcher = /\r?\n/
      // If options is only argument.
      } else if (typeof matcher === 'object' && !(matcher instanceof RegExp) && !matcher[Symbol.split]) {
        options = matcher
        matcher = /\r?\n/
      }
      break

    case 2:
      // If mapper and options are arguments.
      if (typeof matcher === 'function') {
        options = mapper
        mapper = matcher
        matcher = /\r?\n/
      // If matcher and options are arguments.
      } else if (typeof mapper === 'object') {
        options = mapper
        mapper = noop
      }
  }

  options = Object.assign({}, options)
  options.autoDestroy = true
  options.transform = transform
  options.flush = flush
  options.readableObjectMode = true

  const stream = new Transform(options)

  stream[kLast] = ''
  stream[kDecoder] = new StringDecoder('utf8')
  stream.matcher = matcher
  stream.mapper = mapper
  stream.maxLength = options.maxLength
  stream.skipOverflow = options.skipOverflow || false
  stream.overflow = false
  stream._destroy = function (err: Error, cb: () => void): void {
    // Weird Node v12 bug that we need to work around
    this._writableState.errorEmitted = false
    cb(err)
  }

  return stream
}

export = split
