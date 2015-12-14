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

/** end **/

export function PieUtilities(){

}

PieUtilities.colors = {
    day: "#f37342",
    night: "#37445c"
};

PieUtilities.colors.gradients = {
    sunrise: generateGradientStepsCss(PieUtilities.colors.day, PieUtilities.colors.night, 360)
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
    return angleInDegrees*4;
};

PieUtilities.toAngleSize = function(minutes){
    return minutes*.25;
};

PieUtilities.toAngle = function(a_moment){

};

PieUtilities.toTimeOfDay = function(angleInDegrees, _format){

    var format = _format || "dddd, MMMM Do YYYY, h:mm:ss a",
        minutes = PieUtilities.toMinutes(angleInDegrees),
        startOfDay = moment(moment().format("YYYY MM DD")),
        timeOfDay = startOfDay.add(minutes, 'minutes');

    return timeOfDay.format(format);

};

PieUtilities.colorForAngle = function(terminalAngleInDegrees){
    var roundedTerminalDegree = Math.ceil(terminalAngleInDegrees/1);
    return PieUtilities.colors.gradients.sunrise[roundedTerminalDegree];
};