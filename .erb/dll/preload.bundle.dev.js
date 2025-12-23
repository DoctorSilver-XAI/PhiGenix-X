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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlbG9hZC5idW5kbGUuZGV2LmpzIiwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPOzs7Ozs7Ozs7O0FDVkEscUM7Ozs7OztVQ0FBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7Ozs7Ozs7OztBQzVCQSxpREFBaUQ7QUFDakQsZ0NBQWdDO0FBQ2hDLG1FQUF3RTtBQUt4RSxNQUFNLGVBQWUsR0FBRztJQUN0QixXQUFXLEVBQUU7UUFDWCxXQUFXLENBQUMsT0FBaUIsRUFBRSxHQUFHLElBQWU7WUFDL0Msc0JBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUNELEVBQUUsQ0FBQyxPQUFpQixFQUFFLElBQWtDO1lBQ3RELE1BQU0sWUFBWSxHQUFHLENBQUMsTUFBd0IsRUFBRSxHQUFHLElBQWUsRUFBRSxFQUFFLENBQ3BFLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQ2hCLHNCQUFXLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztZQUV0QyxPQUFPLEdBQUcsRUFBRTtnQkFDVixzQkFBVyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDcEQsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNELElBQUksQ0FBQyxPQUFpQixFQUFFLElBQWtDO1lBQ3hELHNCQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBQ0QsTUFBTSxDQUFDLE9BQWlCLEVBQUUsR0FBRyxJQUFlO1lBQzFDLE9BQU8sc0JBQVcsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDOUMsQ0FBQztLQUNGO0NBQ0YsQ0FBQztBQUVGLE1BQU0sWUFBWSxHQUFHO0lBQ25CLE9BQU8sRUFBRSxDQUFDLElBQWdELEVBQUUsRUFBRSxDQUM1RCxzQkFBVyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUM7SUFDNUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLHNCQUFXLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDO0lBQ25ELGFBQWEsRUFBRSxDQUFDLFFBQW9FLEVBQUUsRUFBRTtRQUN0RixNQUFNLFlBQVksR0FBRyxDQUFDLE1BQXdCLEVBQUUsSUFBZ0QsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BILHNCQUFXLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ25ELE9BQU8sR0FBRyxFQUFFLENBQUMsc0JBQVcsQ0FBQyxjQUFjLENBQUMsb0JBQW9CLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDOUUsQ0FBQztJQUNELGNBQWMsRUFBRSxDQUFDLE1BQWUsRUFBRSxFQUFFLENBQUMsc0JBQVcsQ0FBQyxNQUFNLENBQUMsd0JBQXdCLEVBQUUsTUFBTSxDQUFDO0lBQ3pGLGtCQUFrQixFQUFFLENBQUMsUUFBb0IsRUFBRSxFQUFFO1FBQzNDLE1BQU0sWUFBWSxHQUFHLENBQUMsTUFBd0IsRUFBRSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDOUQsc0JBQVcsQ0FBQyxFQUFFLENBQUMseUJBQXlCLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDeEQsT0FBTyxHQUFHLEVBQUUsQ0FBQyxzQkFBVyxDQUFDLGNBQWMsQ0FBQyx5QkFBeUIsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNqRjtBQUF3RDtRQUN4RDtBQUFpRjtJQUNuRixDQUFDO0lBQ0QsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLENBQUMsc0JBQVcsQ0FBQyxNQUFNLENBQUMsMEJBQTBCLENBQUM7Q0FDeEUsQ0FBQztBQUVGLHdCQUFhLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBQzdELHdCQUFhLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYXhvcmEvd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovL2F4b3JhL2V4dGVybmFsIG5vZGUtY29tbW9uanMgXCJlbGVjdHJvblwiIiwid2VicGFjazovL2F4b3JhL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2F4b3JhLy4vc3JjL21haW4vcHJlbG9hZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2Uge1xuXHRcdHZhciBhID0gZmFjdG9yeSgpO1xuXHRcdGZvcih2YXIgaSBpbiBhKSAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnID8gZXhwb3J0cyA6IHJvb3QpW2ldID0gYVtpXTtcblx0fVxufSkoZ2xvYmFsLCAoKSA9PiB7XG5yZXR1cm4gIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiZWxlY3Ryb25cIik7IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDaGVjayBpZiBtb2R1bGUgZXhpc3RzIChkZXZlbG9wbWVudCBvbmx5KVxuXHRpZiAoX193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0gPT09IHVuZGVmaW5lZCkge1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gRGlzYWJsZSBuby11bnVzZWQtdmFycywgYnJva2VuIGZvciBzcHJlYWQgYXJnc1xuLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiBvZmYgKi9cbmltcG9ydCB7IGNvbnRleHRCcmlkZ2UsIGlwY1JlbmRlcmVyLCBJcGNSZW5kZXJlckV2ZW50IH0gZnJvbSAnZWxlY3Ryb24nO1xuXG5leHBvcnQgdHlwZSBDaGFubmVscyA9ICdpcGMtZXhhbXBsZSc7XG5cblxuY29uc3QgZWxlY3Ryb25IYW5kbGVyID0ge1xuICBpcGNSZW5kZXJlcjoge1xuICAgIHNlbmRNZXNzYWdlKGNoYW5uZWw6IENoYW5uZWxzLCAuLi5hcmdzOiB1bmtub3duW10pIHtcbiAgICAgIGlwY1JlbmRlcmVyLnNlbmQoY2hhbm5lbCwgLi4uYXJncyk7XG4gICAgfSxcbiAgICBvbihjaGFubmVsOiBDaGFubmVscywgZnVuYzogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCkge1xuICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gKF9ldmVudDogSXBjUmVuZGVyZXJFdmVudCwgLi4uYXJnczogdW5rbm93bltdKSA9PlxuICAgICAgICBmdW5jKC4uLmFyZ3MpO1xuICAgICAgaXBjUmVuZGVyZXIub24oY2hhbm5lbCwgc3Vic2NyaXB0aW9uKTtcblxuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaXBjUmVuZGVyZXIucmVtb3ZlTGlzdGVuZXIoY2hhbm5lbCwgc3Vic2NyaXB0aW9uKTtcbiAgICAgIH07XG4gICAgfSxcbiAgICBvbmNlKGNoYW5uZWw6IENoYW5uZWxzLCBmdW5jOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkKSB7XG4gICAgICBpcGNSZW5kZXJlci5vbmNlKGNoYW5uZWwsIChfZXZlbnQsIC4uLmFyZ3MpID0+IGZ1bmMoLi4uYXJncykpO1xuICAgIH0sXG4gICAgaW52b2tlKGNoYW5uZWw6IENoYW5uZWxzLCAuLi5hcmdzOiB1bmtub3duW10pIHtcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5pbnZva2UoY2hhbm5lbCwgLi4uYXJncyk7XG4gICAgfSxcbiAgfSxcbn07XG5cbmNvbnN0IGF4b3JhSGFuZGxlciA9IHtcbiAgc2V0TW9kZTogKG1vZGU6ICdjb21wYWN0JyB8ICdodWInIHwgJ2hpZGRlbicgfCAncGhpdmlzaW9uJykgPT5cbiAgICBpcGNSZW5kZXJlci5pbnZva2UoJ2F4b3JhOnNldC1tb2RlJywgbW9kZSksXG4gIGdldE1vZGU6ICgpID0+IGlwY1JlbmRlcmVyLmludm9rZSgnYXhvcmE6Z2V0LW1vZGUnKSxcbiAgb25Nb2RlQ2hhbmdlZDogKGNhbGxiYWNrOiAobW9kZTogJ2NvbXBhY3QnIHwgJ2h1YicgfCAnaGlkZGVuJyB8ICdwaGl2aXNpb24nKSA9PiB2b2lkKSA9PiB7XG4gICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gKF9ldmVudDogSXBjUmVuZGVyZXJFdmVudCwgbW9kZTogJ2NvbXBhY3QnIHwgJ2h1YicgfCAnaGlkZGVuJyB8ICdwaGl2aXNpb24nKSA9PiBjYWxsYmFjayhtb2RlKTtcbiAgICBpcGNSZW5kZXJlci5vbignYXhvcmE6bW9kZS1jaGFuZ2VkJywgc3Vic2NyaXB0aW9uKTtcbiAgICByZXR1cm4gKCkgPT4gaXBjUmVuZGVyZXIucmVtb3ZlTGlzdGVuZXIoJ2F4b3JhOm1vZGUtY2hhbmdlZCcsIHN1YnNjcmlwdGlvbik7XG4gIH0sXG4gIHNldElnbm9yZU1vdXNlOiAoaWdub3JlOiBib29sZWFuKSA9PiBpcGNSZW5kZXJlci5pbnZva2UoJ2F4b3JhOnNldC1pZ25vcmUtbW91c2UnLCBpZ25vcmUpLFxuICBvblRyaWdnZXJQaGlWaXNpb246IChjYWxsYmFjazogKCkgPT4gdm9pZCkgPT4ge1xuICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IChfZXZlbnQ6IElwY1JlbmRlcmVyRXZlbnQpID0+IGNhbGxiYWNrKCk7XG4gICAgaXBjUmVuZGVyZXIub24oJ2F4b3JhOnRyaWdnZXItcGhpdmlzaW9uJywgc3Vic2NyaXB0aW9uKTtcbiAgICByZXR1cm4gKCkgPT4gaXBjUmVuZGVyZXIucmVtb3ZlTGlzdGVuZXIoJ2F4b3JhOnRyaWdnZXItcGhpdmlzaW9uJywgc3Vic2NyaXB0aW9uKTtcbiAgICBpcGNSZW5kZXJlci5vbignYXhvcmE6dHJpZ2dlci1waGl2aXNpb24nLCBzdWJzY3JpcHRpb24pO1xuICAgIHJldHVybiAoKSA9PiBpcGNSZW5kZXJlci5yZW1vdmVMaXN0ZW5lcignYXhvcmE6dHJpZ2dlci1waGl2aXNpb24nLCBzdWJzY3JpcHRpb24pO1xuICB9LFxuICBtaW5pbWl6ZVBoaVZpc2lvbjogKCkgPT4gaXBjUmVuZGVyZXIuaW52b2tlKCdheG9yYTptaW5pbWl6ZS1waGl2aXNpb24nKSxcbn07XG5cbmNvbnRleHRCcmlkZ2UuZXhwb3NlSW5NYWluV29ybGQoJ2VsZWN0cm9uJywgZWxlY3Ryb25IYW5kbGVyKTtcbmNvbnRleHRCcmlkZ2UuZXhwb3NlSW5NYWluV29ybGQoJ2F4b3JhJywgYXhvcmFIYW5kbGVyKTtcblxuZXhwb3J0IHR5cGUgRWxlY3Ryb25IYW5kbGVyID0gdHlwZW9mIGVsZWN0cm9uSGFuZGxlcjtcbmV4cG9ydCB0eXBlIEF4b3JhSGFuZGxlciA9IHR5cGVvZiBheG9yYUhhbmRsZXI7XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9