// This file patches the module resolution to make require('electron')
// return the built-in Electron API instead of the npm package.

const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

// Override _resolveFilename to intercept 'electron' requests
Module._resolveFilename = function(request: string, parent: any, isMain: boolean, options: any) {
  if (request === 'electron' && parent && parent.filename) {
    // Check if the parent is our app code (not the npm package itself)
    const parentPath = parent.filename;
    if (!parentPath.includes('node_modules/electron')) {
      // This is a request from our app code
      // Don't resolve to the npm package, let Electron handle it
      return 'electron:builtin';
    }
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

// Override _load to handle the 'electron:builtin' marker
const originalLoad = Module._load;
Module._load = function(request: string, parent: any, isMain: boolean) {
  if (request === 'electron:builtin') {
    // Load the real Electron API
    // We need to bypass the npm package and get the built-in module
    // The trick is to use the original _load with a clean cache entry
    const electronPath = require.resolve('electron');
    const cached = require.cache[electronPath];

    // Temporarily remove the npm package from cache
    delete require.cache[electronPath];

    // Also remove the parent from cache to avoid circular dependency
    if (parent && parent.filename) {
      delete require.cache[parent.filename];
    }

    // Try to load electron - this should now resolve to the built-in module
    try {
      const electronModule = originalLoad.call(this, 'electron', parent, isMain);
      return electronModule;
    } finally {
      // Restore the cache entries
      if (cached) {
        require.cache[electronPath] = cached;
      }
    }
  }
  return originalLoad.call(this, request, parent, isMain);
};
