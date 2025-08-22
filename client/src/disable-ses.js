/**
 * @fileoverview Disable SES lockdown for BNB Greenfield SDK compatibility
 * This must be loaded before any other scripts that might trigger SES lockdown
 */

// Prevent SES lockdown from being applied
if (typeof window !== 'undefined') {
  // Override lockdown function to prevent it from running
  window.lockdown = window.lockdown || function() {
    console.warn('SES lockdown disabled for BNB Greenfield SDK compatibility');
    return;
  };
  
  // Preserve critical intrinsics before they can be removed
  window.__originalIntrinsics = {
    Buffer: window.Buffer,
    global: window.global,
    process: window.process,
    eval: window.eval,
    Function: window.Function,
    WeakMap: window.WeakMap,
    WeakSet: window.WeakSet,
    Map: window.Map,
    Set: window.Set,
    Promise: window.Promise,
    Proxy: window.Proxy,
    Reflect: window.Reflect
  };

  // Prevent SES from removing these
  Object.defineProperty(window, 'eval', {
    value: window.eval,
    writable: false,
    configurable: false
  });

  Object.defineProperty(window, 'Function', {
    value: window.Function,
    writable: false,
    configurable: false
  });
}

// Also try to prevent it on globalThis
if (typeof globalThis !== 'undefined') {
  globalThis.lockdown = globalThis.lockdown || function() {
    console.warn('SES lockdown disabled on globalThis for BNB Greenfield SDK compatibility');
    return;
  };
}
