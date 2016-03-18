/**
 * Created by jordanbradley on 3/10/16.
 */

import { TaskBlock } from './TaskBlock';
import { ThreeSegmentButton } from './SleepAdjustmentButton';

Snap.plugin(function (Snap, Element, Paper, global, Fragment) {

    //modified from http://stackoverflow.com/questions/12115691/svg-d3-js-rounded-corner-on-one-corner-of-a-rectangle
    Paper.prototype.roundedRect = function rounded_rect(x, y, w, h, tl, tr, bl, br) {

        var retval;

        retval  = "M" + (x + r) + "," + y;

        retval += "h" + (w - 2*r);

        if (tr) { retval += "a" + r + "," + r + " 0 0 1 " + r + "," + r; }
        else { retval += "h" + r; retval += "v" + r; }

        retval += "v" + (h - 2*r);

        if (br) { retval += "a" + r + "," + r + " 0 0 1 " + -r + "," + r; }
        else { retval += "v" + r; retval += "h" + -r; }

        retval += "h" + (2*r - w);

        if (bl) { retval += "a" + r + "," + r + " 0 0 1 " + -r + "," + -r; }
        else { retval += "h" + -r; retval += "v" + -r; }

        retval += "v" + (2*r - h);

        if (tl) { retval += "a" + r + "," + r + " 0 0 1 " + r + "," + -r; }
        else { retval += "v" + -r; retval += "h" + r; }

        retval += "z";

        return this.path(retval);
    }

});


export function TaskStrip(svgArea, _taskManager) {

    var self = this,
        tasks,
        drawingArea = svgArea,
        taskManager = _taskManager;
        self.drawingArea = drawingArea;

    var stripBarBorderRadius;

    var viewBox;

    var tabWidth,
        tabHeight,
        tabTopOffset;

    var sleepBarHeight,
        sleepBarWidth,
        sleepBarTopOffset,
        sleepBarLeftOffset,
        sleepBarLabelTopOffset,
        sleepBarLabelLeftOffset,
        sleepBarLabelWidth,
        sleepBarLabelTextSize,
        sleepBarLabelHeight;

    var morningTab = drawingArea.rect(),
        nightTab = drawingArea.rect(),
        strip = drawingArea.rect(),
        roundedRectangleMask = drawingArea.rect(),
        sleepBarLabel = drawingArea.text(),
        sleepGradient = drawingArea.gradient("l(0, 0, 1, 0)#F8B978-#5C6879"),
        totalBar = drawingArea.rect(),
        sleepBar = drawingArea.rect();

        self.group = drawingArea.g();
        self.group.add(strip);
        self.group.attr({mask: roundedRectangleMask});

    function init() {

        viewBox = drawingArea.node.attributes[1].nodeValue.split(" ");

        self.taskManager = _taskManager;

        tasks = self.taskManager.getTasks();

        self.totalWidth = viewBox[2]; // should be 100
        self.totalHeight = viewBox[3]; // should be 25

        self.blocks = [];

        self.scale = determineScale();

        //values assuming a 100 by 25 responsive viewbox

        tabTopOffset = 0;
        tabWidth = 0;
        tabHeight = 0;

        stripBarBorderRadius = .75;

        self.sleepAdjustmentButtonLeftOffset = tabWidth + stripBarBorderRadius;
        self.sleepAdjustmentButtonTopOffset = 0;
        self.sleepAdjustmentButtonWidth = 7.899;
        self.sleepAdjustmentButtonHeight = 2.774;

        self.stripTopOffset = 4.5;
        self.stripLeftOffset = tabWidth;
        self.stripWidth = self.totalWidth - (2*self.stripLeftOffset);
        self.stripHeight = 13;

        sleepBarHeight = .81;

        sleepBarLabelTopOffset = self.totalHeight - sleepBarHeight;
        sleepBarLabelLeftOffset = stripBarBorderRadius;
        sleepBarLabelWidth = 4.5;
        sleepBarLabelTextSize = 1;
        sleepBarLabelHeight = sleepBarHeight;

        sleepBarWidth = self.stripWidth - (2*stripBarBorderRadius + sleepBarLabelWidth);
        sleepBarLeftOffset = (sleepBarLabelLeftOffset + sleepBarLabelWidth);
        sleepBarTopOffset = (self.totalHeight - sleepBarHeight) - 0.2;

        if(taskManager.taskListIsValid()){
            draw();
        }

        var morningSleepAdjustmentButton = new ThreeSegmentButton(self, {
            x: self.sleepAdjustmentButtonLeftOffset,
            y: self.sleepAdjustmentButtonTopOffset,
            width: self.sleepAdjustmentButtonWidth,
            height: self.sleepAdjustmentButtonHeight,
            image: "app/assets/sun.png"
        });

        var nightSleepAdjustmentButton = new ThreeSegmentButton(self, {
            x: (self.totalWidth-stripBarBorderRadius) - self.sleepAdjustmentButtonWidth,
            y: self.sleepAdjustmentButtonTopOffset,
            width: self.sleepAdjustmentButtonWidth,
            height: self.sleepAdjustmentButtonHeight,
            image: "app/assets/moon.png"
        });

        morningSleepAdjustmentButton.leftButton.click(wakeUpEarlier);

        eve.on("taskListUpdated", taskListUpdated);
    }

    function taskListUpdated(){
        if(taskManager.taskListIsValid()){
            self.redraw();
        }
    }

    function determineScale(){
        var sleep = self.taskManager.getSleepTasks();
        return {
            min: sleep[0].end,
            max: sleep[1].start
        };
    }

    function drawBlocks() {
        tasks.forEach(function (element, index, array) {
            var block = self.blocks[index];
            if (!block) {
                block = new TaskBlock(self, index);
                self.blocks.push(block);
            } else {
                block.redraw();
            }
        });
    }

    function calculateSleepBarScaleFactor() {
        //determine how much of the sleep goal can be acheived given the current schedule
        var sleepTime = self.taskManager.getSleepTimeInMinutes(),
            sleepGoal = self.taskManager.getSleepGoalInMinutes();
        console.log(sleepTime, sleepGoal);
        return self.taskManager.getSleepTimeInMinutes()/self.taskManager.getSleepGoalInMinutes();
    }

    self.redraw = function (){
        self.scale = determineScale();
        draw();
    };

    function draw(){

        morningTab.attr({x: 0, y: tabTopOffset, width: tabWidth, height: tabHeight, fill: "#f8b978"});

        nightTab.attr({x: self.stripWidth+tabWidth, y:tabTopOffset, width: tabWidth, height: tabHeight, fill: "#37445c"});

        strip.attr({x: self.stripLeftOffset, y: self.stripTopOffset, width: self.stripWidth, height: self.stripHeight, "fill": "#7e3c46", "fill-opacity": .1});

        drawBlocks();

        roundedRectangleMask.attr({x:self.stripLeftOffset, y:self.stripTopOffset, width: self.stripWidth, height: self.stripHeight, rx: stripBarBorderRadius, ry: stripBarBorderRadius, fill: "white"});

        sleepBarLabel.attr({x: sleepBarLabelLeftOffset, y: sleepBarLabelTopOffset, text:"Sleep:", fontSize: 1.31, width: sleepBarLabelWidth, alignmentBaseline: "central", fontFamily: "apercu_medium", fill: "#808080"});

        totalBar.attr({x: sleepBarLeftOffset, y: sleepBarTopOffset, width: sleepBarWidth, height: sleepBarHeight});
        sleepBar.attr({x: sleepBarLeftOffset, y: sleepBarTopOffset, width: (sleepBarWidth * calculateSleepBarScaleFactor()), height: sleepBarHeight});

        sleepBar.attr({rx: sleepBarHeight/2, ry: sleepBarHeight/2, "fill": sleepGradient});
        totalBar.attr({rx: sleepBarHeight/2, ry: sleepBarHeight/2, "fill": "#7e3c46", "fill-opacity": .1});

    };

    function wakeUpEarlier() {
        //create more time for tasks in the morning
        console.log("waking up earlier");
        var sleep = taskManager.getSleepTasks();

        sleep[0].end = moment(sleep[0].end).subtract(30, "minutes").format();
        taskManager.updateTasks();
    }

    init();

}

export function TaskStripDirective(){

    return{
        restrict: 'E',
        replace: true,
        template:'<svg viewBox="0 0 200 200" class="TaskStrip"></svg>',
        link: function($scope, el, attr){
            var newStrip = new TaskStrip(Snap(el[0]), $scope.taskData.tasks);
        }
    }

}