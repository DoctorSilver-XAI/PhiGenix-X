(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(global, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "electron"
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
(module) {

module.exports = require("electron");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Check if module exists (development only)
/******/ 		if (__webpack_modules__[moduleId] === undefined) {
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!*****************************!*\
  !*** ./src/main/preload.ts ***!
  \*****************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
const electron_1 = __webpack_require__(/*! electron */ "electron");
const electronHandler = {
    ipcRenderer: {
        sendMessage(channel, ...args) {
            electron_1.ipcRenderer.send(channel, ...args);
        },
        on(channel, func) {
            const subscription = (_event, ...args) => func(...args);
            electron_1.ipcRenderer.on(channel, subscription);
            return () => {
                electron_1.ipcRenderer.removeListener(channel, subscription);
            };
        },
        once(channel, func) {
            electron_1.ipcRenderer.once(channel, (_event, ...args) => func(...args));
        },
        invoke(channel, ...args) {
            return electron_1.ipcRenderer.invoke(channel, ...args);
        },
    },
};
const axoraHandler = {
    setMode: (mode) => electron_1.ipcRenderer.invoke('axora:set-mode', mode),
    getMode: () => electron_1.ipcRenderer.invoke('axora:get-mode'),
    onModeChanged: (callback) => {
        const subscription = (_event, mode) => callback(mode);
        electron_1.ipcRenderer.on('axora:mode-changed', subscription);
        return () => electron_1.ipcRenderer.removeListener('axora:mode-changed', subscription);
    },
    setIgnoreMouse: (ignore) => electron_1.ipcRenderer.invoke('axora:set-ignore-mouse', ignore),
    onTriggerPhiVision: (callback) => {
        const subscription = (_event) => callback();
        electron_1.ipcRenderer.on('axora:trigger-phivision', subscription);
        return () => electron_1.ipcRenderer.removeListener('axora:trigger-phivision', subscription);
        // removed by dead control flow

        // removed by dead control flow

    },
    minimizePhiVision: () => electron_1.ipcRenderer.invoke('axora:minimize-phivision'),
};
electron_1.contextBridge.exposeInMainWorld('electron', electronHandler);
electron_1.contextBridge.exposeInMainWorld('axora', axoraHandler);

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LEdBQUcsRUFBRSxDQUFDLHNCQUFXLENBQUMsTUFBTSxDQUFDLDBCQUEwQixDQUFDO0NBQ3hFLENBQUM7QUFFRix3QkFBYSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxlQUFlLENBQUMsQ0FBQztBQUM3RCx3QkFBYSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL2F4b3JhL3dlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbiIsIndlYnBhY2s6Ly9heG9yYS9leHRlcm5hbCBub2RlLWNvbW1vbmpzIFwiZWxlY3Ryb25cIiIsIndlYnBhY2s6Ly9heG9yYS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9heG9yYS8uL3NyYy9tYWluL3ByZWxvYWQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRlbHNlIHtcblx0XHR2YXIgYSA9IGZhY3RvcnkoKTtcblx0XHRmb3IodmFyIGkgaW4gYSkgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyA/IGV4cG9ydHMgOiByb290KVtpXSA9IGFbaV07XG5cdH1cbn0pKGdsb2JhbCwgKCkgPT4ge1xucmV0dXJuICIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImVsZWN0cm9uXCIpOyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGV4aXN0cyAoZGV2ZWxvcG1lbnQgb25seSlcblx0aWYgKF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdID09PSB1bmRlZmluZWQpIHtcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyBtb2R1bGVJZCArIFwiJ1wiKTtcblx0XHRlLmNvZGUgPSAnTU9EVUxFX05PVF9GT1VORCc7XG5cdFx0dGhyb3cgZTtcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIERpc2FibGUgbm8tdW51c2VkLXZhcnMsIGJyb2tlbiBmb3Igc3ByZWFkIGFyZ3Ncbi8qIGVzbGludCBuby11bnVzZWQtdmFyczogb2ZmICovXG5pbXBvcnQgeyBjb250ZXh0QnJpZGdlLCBpcGNSZW5kZXJlciwgSXBjUmVuZGVyZXJFdmVudCB9IGZyb20gJ2VsZWN0cm9uJztcblxuZXhwb3J0IHR5cGUgQ2hhbm5lbHMgPSAnaXBjLWV4YW1wbGUnO1xuXG5cbmNvbnN0IGVsZWN0cm9uSGFuZGxlciA9IHtcbiAgaXBjUmVuZGVyZXI6IHtcbiAgICBzZW5kTWVzc2FnZShjaGFubmVsOiBDaGFubmVscywgLi4uYXJnczogdW5rbm93bltdKSB7XG4gICAgICBpcGNSZW5kZXJlci5zZW5kKGNoYW5uZWwsIC4uLmFyZ3MpO1xuICAgIH0sXG4gICAgb24oY2hhbm5lbDogQ2hhbm5lbHMsIGZ1bmM6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQpIHtcbiAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IChfZXZlbnQ6IElwY1JlbmRlcmVyRXZlbnQsIC4uLmFyZ3M6IHVua25vd25bXSkgPT5cbiAgICAgICAgZnVuYyguLi5hcmdzKTtcbiAgICAgIGlwY1JlbmRlcmVyLm9uKGNoYW5uZWwsIHN1YnNjcmlwdGlvbik7XG5cbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGlwY1JlbmRlcmVyLnJlbW92ZUxpc3RlbmVyKGNoYW5uZWwsIHN1YnNjcmlwdGlvbik7XG4gICAgICB9O1xuICAgIH0sXG4gICAgb25jZShjaGFubmVsOiBDaGFubmVscywgZnVuYzogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCkge1xuICAgICAgaXBjUmVuZGVyZXIub25jZShjaGFubmVsLCAoX2V2ZW50LCAuLi5hcmdzKSA9PiBmdW5jKC4uLmFyZ3MpKTtcbiAgICB9LFxuICAgIGludm9rZShjaGFubmVsOiBDaGFubmVscywgLi4uYXJnczogdW5rbm93bltdKSB7XG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKGNoYW5uZWwsIC4uLmFyZ3MpO1xuICAgIH0sXG4gIH0sXG59O1xuXG5jb25zdCBheG9yYUhhbmRsZXIgPSB7XG4gIHNldE1vZGU6IChtb2RlOiAnY29tcGFjdCcgfCAnaHViJyB8ICdoaWRkZW4nIHwgJ3BoaXZpc2lvbicpID0+XG4gICAgaXBjUmVuZGVyZXIuaW52b2tlKCdheG9yYTpzZXQtbW9kZScsIG1vZGUpLFxuICBnZXRNb2RlOiAoKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ2F4b3JhOmdldC1tb2RlJyksXG4gIG9uTW9kZUNoYW5nZWQ6IChjYWxsYmFjazogKG1vZGU6ICdjb21wYWN0JyB8ICdodWInIHwgJ2hpZGRlbicgfCAncGhpdmlzaW9uJykgPT4gdm9pZCkgPT4ge1xuICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IChfZXZlbnQ6IElwY1JlbmRlcmVyRXZlbnQsIG1vZGU6ICdjb21wYWN0JyB8ICdodWInIHwgJ2hpZGRlbicgfCAncGhpdmlzaW9uJykgPT4gY2FsbGJhY2sobW9kZSk7XG4gICAgaXBjUmVuZGVyZXIub24oJ2F4b3JhOm1vZGUtY2hhbmdlZCcsIHN1YnNjcmlwdGlvbik7XG4gICAgcmV0dXJuICgpID0+IGlwY1JlbmRlcmVyLnJlbW92ZUxpc3RlbmVyKCdheG9yYTptb2RlLWNoYW5nZWQnLCBzdWJzY3JpcHRpb24pO1xuICB9LFxuICBzZXRJZ25vcmVNb3VzZTogKGlnbm9yZTogYm9vbGVhbikgPT4gaXBjUmVuZGVyZXIuaW52b2tlKCdheG9yYTpzZXQtaWdub3JlLW1vdXNlJywgaWdub3JlKSxcbiAgb25UcmlnZ2VyUGhpVmlzaW9uOiAoY2FsbGJhY2s6ICgpID0+IHZvaWQpID0+IHtcbiAgICBjb25zdCBzdWJzY3JpcHRpb24gPSAoX2V2ZW50OiBJcGNSZW5kZXJlckV2ZW50KSA9PiBjYWxsYmFjaygpO1xuICAgIGlwY1JlbmRlcmVyLm9uKCdheG9yYTp0cmlnZ2VyLXBoaXZpc2lvbicsIHN1YnNjcmlwdGlvbik7XG4gICAgcmV0dXJuICgpID0+IGlwY1JlbmRlcmVyLnJlbW92ZUxpc3RlbmVyKCdheG9yYTp0cmlnZ2VyLXBoaXZpc2lvbicsIHN1YnNjcmlwdGlvbik7XG4gICAgaXBjUmVuZGVyZXIub24oJ2F4b3JhOnRyaWdnZXItcGhpdmlzaW9uJywgc3Vic2NyaXB0aW9uKTtcbiAgICByZXR1cm4gKCkgPT4gaXBjUmVuZGVyZXIucmVtb3ZlTGlzdGVuZXIoJ2F4b3JhOnRyaWdnZXItcGhpdmlzaW9uJywgc3Vic2NyaXB0aW9uKTtcbiAgfSxcbiAgbWluaW1pemVQaGlWaXNpb246ICgpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnYXhvcmE6bWluaW1pemUtcGhpdmlzaW9uJyksXG59O1xuXG5jb250ZXh0QnJpZGdlLmV4cG9zZUluTWFpbldvcmxkKCdlbGVjdHJvbicsIGVsZWN0cm9uSGFuZGxlcik7XG5jb250ZXh0QnJpZGdlLmV4cG9zZUluTWFpbldvcmxkKCdheG9yYScsIGF4b3JhSGFuZGxlcik7XG5cbmV4cG9ydCB0eXBlIEVsZWN0cm9uSGFuZGxlciA9IHR5cGVvZiBlbGVjdHJvbkhhbmRsZXI7XG5leHBvcnQgdHlwZSBBeG9yYUhhbmRsZXIgPSB0eXBlb2YgYXhvcmFIYW5kbGVyO1xuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==