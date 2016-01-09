/** modified from https://gist.github.com/paulmillr/6205257 **/

var transitionColor = function(from, to, count) {
    var div = count + 1;
    var int = parseInt(from, 16); // 100
    var intTo = parseInt(to, 16); // 50
    var list = []; // 5
    var diff = int - intTo; // 50
    var isNegative = diff < 0; // false
    var one = diff / div; // 10

    list.push(from);
    for (var i = 1; i <= div; i++) {
        list.push(Math.floor(int - (one * i)).toString(16));
    }

    return list;
};

var transition = function(from, to, div) {
    from = from.substr(1);
    to = to.substr(1);

    if (div == null) div = 3;
    var r = from.slice(0, 2), g = from.slice(2, 4), b = from.slice(4, 6);
    var rt = to.slice(0, 2), gt = to.slice(2, 4), bt = to.slice(4, 6);
    var allR = transitionColor(r, rt, div);
    var allG = transitionColor(g, gt, div);
    var allB = transitionColor(b, bt, div);
    var list = [];

    allR.forEach(function(_, i) {
        list.push('' + allR[i] + allG[i] + allB[i]);
    });

    return list;
};

var generateGradientStepsCss = function(from, to, div) {
    var values = transition(from, to, div);
    var total = 100 / (div + 1);
    var obj = [];
    var list  = [];
    for (var i = 0; i <= div + 1; i++) {
        obj.push({percentage: Math.floor(total * i), value: values[i]});
    }

    var cssValues = obj.map(function(value) {
        return '#' + value.value + ' ' + value.percentage + '%';
    }).join(', ');

    var hexValues = obj.map(function(value) {
        return '#'+value.value;
    });

    return hexValues;
};

var fullFormatString = "dddd, MMMM Do YYYY, h:mm:ss a";

/** end **/

export function PieUtilities(){

}

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

PieUtilities.colors.gradients = {
    sunrise: generateGradientStepsCss(PieUtilities.colors.day, PieUtilities.colors.night, 360)
};

PieUtilities.FULL_FORMAT_STRING = "dddd, MMMM Do YYYY, h:mm:ss a";

PieUtilities.today = moment(moment().format("YYYY MM DD"));

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
        duration = moment.duration(end.subtract(start)).asMinutes();

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

//console.log(PieUtilities.toTimeOfDay(111).format("h:mm a"));

PieUtilities.colorForAngle = function(terminalAngleInDegrees){
    var roundedTerminalDegree = Math.ceil(terminalAngleInDegrees/1);
    return PieUtilities.colors.gradients.sunrise[roundedTerminalDegree];
};