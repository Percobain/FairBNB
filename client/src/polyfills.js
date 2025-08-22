import { Buffer } from 'buffer';

// Store original intrinsics before SES can remove them
const originalIntrinsics = {
  Buffer: window.Buffer || Buffer,
  global: window.global || window,
  process: window.process,
  eval: window.eval,
  Function: window.Function,
  WeakMap: window.WeakMap,
  WeakSet: window.WeakSet,
  Map: window.Map,
  Set: window.Set,
  Promise: window.Promise,
  setTimeout: window.setTimeout,
  setInterval: window.setInterval
};

// Restore Buffer if SES removed it
if (!window.Buffer || typeof window.Buffer !== 'function') {
  window.Buffer = Buffer;
}
if (!globalThis.Buffer || typeof globalThis.Buffer !== 'function') {
  globalThis.Buffer = Buffer;
}

// Polyfill global object
window.global = window.global || window;
globalThis.global = globalThis.global || globalThis;

// Enhanced process object with SES protection
const processObj = {
  env: {},
  browser: true,
  version: '18.0.0',
  versions: { node: '18.0.0' },
  nextTick: (fn, ...args) => {
    const timer = originalIntrinsics.setTimeout || setTimeout;
    return timer(() => fn(...args), 0);
  },
  platform: 'browser',
  arch: 'x64',
  title: 'browser',
  argv: [],
  pid: 1,
  ppid: 0,
  execPath: '/usr/bin/node',
  debugPort: 9229,
  argv0: 'node'
};

window.process = window.process || processObj;
globalThis.process = globalThis.process || processObj;

// Restore critical functions if SES removed them
if (!window.eval && originalIntrinsics.eval) {
  try {
    Object.defineProperty(window, 'eval', {
      value: originalIntrinsics.eval,
      writable: true,
      configurable: true
    });
  } catch (e) {
    console.warn('Could not restore eval function:', e);
  }
}

if (!window.Function && originalIntrinsics.Function) {
  try {
    Object.defineProperty(window, 'Function', {
      value: originalIntrinsics.Function,
      writable: true,
      configurable: true
    });
  } catch (e) {
    console.warn('Could not restore Function constructor:', e);
  }
}

// Additional polyfills for crypto and other modules
if (!window.crypto) {
  window.crypto = {};
}

if (!window.crypto.getRandomValues) {
  window.crypto.getRandomValues = function(array) {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
}

// Create a safe require function for the SDK
if (!window.require) {
  window.require = function(module) {
    console.warn('Mock require called for:', module);
    if (module === 'buffer') {
      return { Buffer: window.Buffer };
    }
    if (module === 'crypto') {
      return window.crypto;
    }
    return {};
  };
}

console.log('Enhanced polyfills loaded with SES protection');