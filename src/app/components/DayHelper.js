/**
 * Created by jordanbradley on 3/19/16.
 */

//simple moment wrapper

export function Day(day_string_yyyy_mm_dd){

    var day = day_string_yyyy_mm_dd || moment().startOf('day').format("YYYY MM DD");

    this.string = moment(day).format();

    this.at = function(time_string_hh_mm_a){
        return moment(day+" "+time_string_hh_mm_a, "YYYY MM DD h:mm a").format();
    };

    this.nextDay = function(){
        var next_day = moment(day).startOf('day').add(1, 'day').format("YYYY MM DD");
        return new Day(next_day);
    };

    this.previousDay = function(){
        var prev_day = moment(day).startOf('day').subtract(1, 'day').format("YYYY MM DD");
        return new Day(prev_day);
    };

}