var lastValidatedUIValue;

Snap.plugin(function (Snap, Element, Paper, global, Fragment) {


    Math.TWOPI = 2 * Math.PI;

    Number.prototype.mod = function (n) {
        return ((this % n) + n) % n;
    };

    Number.prototype.roundToTheNearest = function (i) {
        var i = i || 1;
        return Math.ceil(this / i) * i;
    };

    Paper.prototype.relativeMousePoints = function (mx, my) {
        var root = this.node;
        var mousePoint = root.createSVGPoint();
        mousePoint.x = mx;
        mousePoint.y = my;
        var p = this.circle();
        var transformedPoint = mousePoint.matrixTransform(p.node.getScreenCTM().inverse());
        p.remove();
        return transformedPoint;
    };

    Paper.prototype.limitUIValueIfNecessary = function(liveValue, min, max){

        var maxValue = (max != undefined) ? max : liveValue,
            minValue = (min != undefined) ? min : liveValue;

        //console.log("min is: "+min);
        //console.log("max is: "+max);
        //console.log("live is: "+liveValue);

        if(liveValue >= maxValue){
            lastValidatedUIValue = maxValue;
            //console.log("moving too far forward, using max validated value");
        } else if(liveValue <= minValue){
            lastValidatedUIValue = minValue;
            //console.log("going to far backward, using min validated value");
        } else {
            lastValidatedUIValue = liveValue;
            //console.log("using live value");
        }

        //console.log("used ", lastValidatedUIValue);

        return {
            limitedValue: lastValidatedUIValue,
            liveValue: liveValue
        }

    };

    //deprecated
    Paper.prototype.getUIValueFromMousePosition = function (settings) {

        var liveValue = settings.valueFn(settings.mouseX, settings.mouseY),
            maxValue = (settings.max != undefined) ? settings.max : liveValue,
            minValue = (settings.min != undefined) ? settings.min : liveValue;

        console.log("min is: "+settings.min);
        console.log("max is: "+settings.max);

        if(liveValue > maxValue){
            lastValidatedUIValue = maxValue;
            console.log("moving too far forward, using max validated value");
        } else if(liveValue < minValue){
            lastValidatedUIValue = minValue;
            console.log("going to far backward, using min validated value");
        } else {
            lastValidatedUIValue = liveValue;
            console.log("using live value: "+liveValue);
        }

        return lastValidatedUIValue;
    };

    Paper.prototype.getCurrentPixelRatio = function(){

        /*determine the relationship between the real width/height and the svg viewbox width/height.
         this is similar to the viewport meta tag wherein a local viewport is specified
         and may be different from the pysical device width/height*/

        var viewBox = this.node.attributes[1].nodeValue.split(" ");
        return {
            x: viewBox[2]/this.node.clientWidth,
            y: viewBox[3]/this.node.clientHeight
        }
    };


});