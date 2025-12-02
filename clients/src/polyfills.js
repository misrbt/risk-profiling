// Manual polyfills for Windows 7 32-bit Chrome compatibility

// Array.find polyfill
if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = parseInt(list.length) || 0;
    var thisArg = arguments[1];
    for (var i = 0; i < length; i++) {
      var element = list[i];
      if (predicate.call(thisArg, element, i, list)) {
        return element;
      }
    }
    return undefined;
  };
}

// Array.includes polyfill
if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement /*, fromIndex*/) {
    var O = Object(this);
    var len = parseInt(O.length) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1]) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) { k = 0; }
    }
    function sameValueZero(x, y) {
      return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
    }
    for (; k < len; k++) {
      if (sameValueZero(O[k], searchElement)) {
        return true;
      }
    }
    return false;
  };
}

// Object.assign polyfill
if (typeof Object.assign !== 'function') {
  Object.assign = function(target) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    var to = Object(target);
    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];
      if (nextSource != null) {
        for (var nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}

// String.includes polyfill
if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    if (typeof start !== 'number') {
      start = 0;
    }
    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

// Promise polyfill (basic)
if (typeof Promise === 'undefined') {
  window.Promise = function(executor) {
    var self = this;
    self.state = 'pending';
    self.value = undefined;
    self.handlers = [];
    
    function resolve(result) {
      if (self.state === 'pending') {
        self.state = 'fulfilled';
        self.value = result;
        self.handlers.forEach(handle);
        self.handlers = null;
      }
    }
    
    function reject(error) {
      if (self.state === 'pending') {
        self.state = 'rejected';
        self.value = error;
        self.handlers.forEach(handle);
        self.handlers = null;
      }
    }
    
    function handle(handler) {
      if (self.state === 'pending') {
        self.handlers.push(handler);
      } else {
        if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
          handler.onFulfilled(self.value);
        }
        if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
          handler.onRejected(self.value);
        }
      }
    }
    
    this.then = function(onFulfilled, onRejected) {
      return new Promise(function(resolve, reject) {
        handle({
          onFulfilled: function(result) {
            try {
              resolve(onFulfilled ? onFulfilled(result) : result);
            } catch (ex) {
              reject(ex);
            }
          },
          onRejected: function(error) {
            try {
              resolve(onRejected ? onRejected(error) : error);
            } catch (ex) {
              reject(ex);
            }
          }
        });
      });
    };
    
    executor(resolve, reject);
  };
}

// CSS Grid fallback detection and Flexbox polyfill
if (!CSS.supports || !CSS.supports('display', 'grid')) {
  document.documentElement.className += ' no-cssgrid';
}

if (!CSS.supports || !CSS.supports('display', 'flex')) {
  document.documentElement.className += ' no-flexbox';
}

// Add CSS for fallbacks
const fallbackCSS = `
  .no-cssgrid .grid {
    display: block;
  }
  
  .no-cssgrid .grid > * {
    display: inline-block;
    vertical-align: top;
    width: 100%;
    margin-bottom: 1rem;
  }
  
  .no-flexbox .flex {
    display: block;
  }
  
  .no-flexbox .flex > * {
    display: inline-block;
    vertical-align: top;
  }
  
  /* IE11 specific fixes */
  @media screen and (-ms-high-contrast: active), (-ms-high-contrast: none) {
    .flex {
      display: -ms-flexbox;
      display: flex;
    }
    
    .flex-1 {
      -ms-flex: 1;
      flex: 1;
    }
    
    .justify-center {
      -ms-flex-pack: center;
      justify-content: center;
    }
    
    .items-center {
      -ms-flex-align: center;
      align-items: center;
    }
    
    .flex-col {
      -ms-flex-direction: column;
      flex-direction: column;
    }
  }
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = fallbackCSS;
document.head.appendChild(style);