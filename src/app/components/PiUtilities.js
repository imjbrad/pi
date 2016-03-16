var fullFormatString = "dddd, MMMM Do YYYY, h:mm:ss a";
var lastValidatedUIValue;

Snap.plugin(function (Snap, Element, Paper, global, Fragment) {

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

    Paper.prototype.getUIValueFromMousePosition = function (settings) {

        var liveValue = settings.valueFn(settings.mouseX, settings.mouseY),
            maxValue = settings.max || liveValue,
            minValue = settings.min || liveValue;

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
            console.log(viewBox);
        return {
            x: viewBox[2]/this.node.clientWidth,
            y: viewBox[3]/this.node.clientHeight
        }
    };


});

export function PieUtilities(){

}

PieUtilities.interface = {};

PieUtilities.themes = {

};

PieUtilities.colors = {
    day: "#f37342",
    night: "#37445c",
    pieOffWhite: "#FBFBFB",
    pieLightGrey: "#E5E5E5",
    pieGrey: "#CCCCCC",
    pieDarkGrey: "818285",
    pieOrange: "#f37342",
    pieOrangeCream: "#f8b978",
    piePink: "#f1656f",
    pieLightBlue: "#9ec2e1",
    pieDimBlue: "#5c6879",
    pieDarkBlue: "#37445c",
    pieYellow: "#f7ce6e"
};

PieUtilities.FULL_FORMAT_STRING = "dddd, MMMM Do YYYY, h:mm:ss a";

PieUtilities.today = moment().startOf("day");

PieUtilities.today_format_string = "YYYY MM DD";

PieUtilities.today_string = moment().format("YYYY MM DD");

PieUtilities.task_data_filter = function(task, index, array){
    return !task.type;
};

PieUtilities.humanizeMinutes = function(_minutes){

    var duration = moment.duration(_minutes, 'minutes'),
        hours = duration.hours(),
        minutes = duration.minutes(),
        string = "";

    //special case
    if(hours == 0 && duration.asMinutes() > 0){
        hours = 24
    }

    if(hours){
        string += hours+"hr";
    }

    if(minutes){
        string += (" "+minutes+"min");
    }else{
        string = hours+" Hours";
    }

    return string;

};

PieUtilities.toMinutes = function(angleInDegrees){
    return (angleInDegrees*4);
};

PieUtilities.toAngleSize = function(minutes){
    return (minutes*.25);
};

PieUtilities.toAngle = function(time_of_day){

    var startOfDay = moment(moment().format("YYYY MM DD")),
        timeOfDay = moment.isMoment(time_of_day) ? time_of_day : moment(time_of_day),
        minutes = moment.duration(timeOfDay.subtract(startOfDay)).asMinutes();

    return PieUtilities.toAngleSize(minutes);
};

PieUtilities.todayAt = function(time_of_day){
    return moment(time_of_day, "h:mm a").format();
};

PieUtilities.taskSize = function(_start, _end){

    var start = moment(_start),
        end = moment(_end),
        duration = end.diff(start, "minutes");

  return duration;
};

PieUtilities.toTimeOfDay = function(angleInDegrees, _format){

    var __format = "dddd, MMMM Do YYYY, h:mm a";

    var format = _format == true ? __format : "",
        minutes = PieUtilities.toMinutes(angleInDegrees),
        timeOfDay = moment(moment().format("YYYY MM DD")).add(minutes, 'm');

    if(_format){
        console.log("returning string");
        return timeOfDay.format(format);
    }

    return moment(timeOfDay);
};


PieUtilities.toLinearPositionFromTimeOfDay = function (time, scaleMinTime, scaleMaxTime){
    var time = moment(time);

    var minTime = scaleMinTime ? moment(scaleMinTime) : moment().startOf("day");
    var maxTime = scaleMaxTime ? moment(scaleMaxTime) : moment().endOf("day");

    var timeSinceStart = time.diff(minTime, "minutes");
    var totalTimeInMinutes = maxTime.diff(minTime, 'minutes');

    var linearScaleFactor = timeSinceStart / totalTimeInMinutes;

    return linearScaleFactor;
};

PieUtilities.toTimeOfDayFromLinearScale = function(linearScaleFactor, scaleMinTime, scaleMaxTime){

    var minTime = scaleMinTime ? moment(scaleMinTime) : moment().startOf("day");
    var maxTime = scaleMaxTime ? moment(scaleMaxTime) : moment().endOf("day");
    var totalTimeInMinutes = maxTime.diff(minTime, 'minutes');

    var minutesSinceMinTime = linearScaleFactor * totalTimeInMinutes;

    var time = minTime.add(minutesSinceMinTime, "minutes").seconds(0);

    return time.format();

};

PieUtilities.interface.getLiveUIValueOrAPreviouslyValidUIValue = function(mx, my) {

};
