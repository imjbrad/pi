export function Emitter() {
}

var e = $('body');

Emitter.on = function(){
    console.log("hi"); e.bind.apply(this, arguments); };

Emitter.trigger = e.trigger;