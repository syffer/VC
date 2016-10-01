"use strict";

function EventBus() {
    let handlers = {};
    

    /**
     * Adds a callback to be executed when the given event is triggered
     * @throws {Error} [[Description]]
     * @param {string}   event              the event to be listened
     * @param {function} callback           the function to be called when the event is triggered
     * @param {object}   listener=undefined [[Description]]
     * @param {boolean}  once=false         true if the callback is to be called only once
     */
    this.on = function (event, callback, listener=undefined, once=false) { 
        if (typeof callback !== "function") throw new Error("callback must be a function");
        
        let handler = {
            listener: listener,
            callback: callback,
            once: once,
        };
        
        handlers[event] = handlers[event] || [];
        handlers[event].push(handler);            
    }
    
    /**
     * Adds a callback to be executed only once when the given event is triggered
     * @param {string}   event    the event to be listened
     * @param {function} callback the function to be called when the event is triggered
     * @param {object}   listener the object that listens to the event
     */
    this.once = function (event, callback, listener) {
        this.on(event, callback, listener, true);
    }

    /**
     * Removes a callback from the given event
     * @param   {string}   event    the event where the callback was assigned to
     * @param   {object}   listener the object that listened to the event
     * @param   {function} callback the function to be removed (if specified)
     */
    this.off = function (event, listener, callback) {
        if (!handlers[event]) return;
        
        handlers[event] = handlers[event].filter(function (handler, index) {
            return !(handler.listener === listener && (handler.callback === callback || callback === undefined)); 
        });
    }

    /**
     * Triggers an event, calls each callbacks of that event
     * @param {string} event      the event to trigger  
     * @param {object} sender     the object that triggers the event
     * @param {Array}  ...options some options that will be passed as arguments to the callbacks 
     */
    this.trigger = function (event, sender, ...options) { 
        if (!handlers[event]) return;   // if no listeners on this event ever
        
        handlers[event] = handlers[event].filter(function (handler, index) { 
            handler.callback.call(handler.listener, sender, ...options);
            return !handler.once;
        });
    }

    /**
     * Resets (removes every callbacks)
     */
    this.reset = function () {
        handlers = {};
    }
    
}

