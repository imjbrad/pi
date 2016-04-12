export var PiUtilities = {};

PiUtilities.themes = {

};

PiUtilities.colors = {
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

PiUtilities.today = moment().format("YYYY MM DD");

PiUtilities.tomorrow = moment().startOf("day").add(1, 'd').format("YYYY MM DD");

PiUtilities.full_format = "dddd, MMMM Do YYYY, h:mm:ss a";

PiUtilities.short_format = "YYYY MM DD";

PiUtilities.today_yyyy_mm_dd = moment().format("YYYY MM DD");

PiUtilities.task_data_filter = function(task, index, array){
    return !task.type;
};

PiUtilities.toMinutes = function(angleInDegrees){
    return (angleInDegrees*4);
};

PiUtilities.toAngleSize = function(minutes){
    return (minutes*.25);
};

PiUtilities.toAngle = function(time_of_day){

    var startOfDay = moment(moment().format("YYYY MM DD")),
        timeOfDay = moment.isMoment(time_of_day) ? time_of_day : moment(time_of_day),
        minutes = moment.duration(timeOfDay.subtract(startOfDay)).asMinutes();

    return PiUtilities.toAngleSize(minutes);
};

PiUtilities.thisDayAt = function (time_of_day){
    return moment(time_of_day, "h:mm a").format();
};

PiUtilities.tomorrowAt = function(time_of_day){
    return moment(PiUtilities.tomorrow+" "+time_of_day, "YYYY MM DD h:mm a").format();
};

PiUtilities.taskSize = function(_start, _end){

    var start = moment(_start),
        end = moment(_end),
        duration = end.diff(start, "minutes");

  return duration;
};

PiUtilities.toTimeOfDay = function(angleInDegrees, _format){

    var __format = "dddd, MMMM Do YYYY, h:mm a";

    var format = _format == true ? __format : "",
        minutes = PiUtilities.toMinutes(angleInDegrees),
        timeOfDay = moment(moment().format("YYYY MM DD")).add(minutes, 'm');

    if(_format){
        console.log("returning string");
        return timeOfDay.format(format);
    }

    return moment(timeOfDay);
};

PiUtilities.toLinearSize = function(start, end, scaleMinTime, scaleMaxTime){
    var startPosition = PiUtilities.toLinearPosition0to1FromTimeOfDay(start, scaleMinTime, scaleMaxTime);
    var terminalPosition = PiUtilities.toLinearPosition0to1FromTimeOfDay(end, scaleMinTime, scaleMaxTime);
    return terminalPosition - startPosition;
};

PiUtilities.toLinearSizeFromTaskSize = function(minutes, scaleMinTime, scaleMaxTime){
    return PiUtilities.toLinearPosition0to1FromTimeOfDay(moment(scaleMinTime).add(minutes, "minutes").format(), scaleMinTime, scaleMaxTime)
};

PiUtilities.toLinearPosition0to1FromTimeOfDay = function (time, scaleMinTime, scaleMaxTime){
    var time = moment(time);

    var minTime = scaleMinTime ? moment(scaleMinTime) : moment().startOf("day");
    var maxTime = scaleMaxTime ? moment(scaleMaxTime) : moment().endOf("day");

    var timeSinceStart = time.diff(minTime, "minutes");
    var totalTimeInMinutes = maxTime.diff(minTime, 'minutes');

    var linearScaleFactor = timeSinceStart / totalTimeInMinutes;

    return linearScaleFactor;
};

PiUtilities.toTimeOfDayFromLinearPosition0to1 = function (linearScaleFactor, scaleMinTime, scaleMaxTime){

    var minTime = scaleMinTime ? moment(scaleMinTime) : moment().startOf("day");
    var maxTime = scaleMaxTime ? moment(scaleMaxTime) : moment().endOf("day");
    var totalTimeInMinutes = maxTime.diff(minTime, 'minutes');

    var minutesSinceMinTime = linearScaleFactor * totalTimeInMinutes;

    var time = minTime.add(minutesSinceMinTime, "minutes").seconds(0);

    return time.format();

};

PiUtilities.toLinearPosition0to1FromArbitraryXPosition = function (xPosition, linearWidth){
    return xPosition / linearWidth;
};

PiUtilities.toXPositionFromLinearPosition0to1 = function (linearPosition, linearWidth){
    return linearPosition * linearWidth;
};