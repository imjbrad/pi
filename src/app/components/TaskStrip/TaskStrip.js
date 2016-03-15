/**
 * Created by jordanbradley on 3/10/16.
 */

import { TaskBlock } from './TaskBlock';

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

    var tasks,
        drawingArea = svgArea;

    var tabWidth,
        tabHeight,
        tabTopOffset;

    var stripBarBorderRadius;

    var sleepBarHeight,
        sleepBarWidth,
        sleepBarTopOffset,
        sleepBarLeftOffset;

    function init() {

        self.taskManager = _taskManager;
        self.drawingArea = drawingArea;
        self.group = self.drawingArea.g();

        tasks = taskManager.getTasks();

        var viewBox = drawingArea.node.attributes[1].nodeValue.split(" ");

        self.totalWidth = viewBox[2];
        self.totalHeight = viewBox[3];
        self.blocks = [];

        var sleep = self.taskManager.getSleepTasks();

        self.scale = {
            min: sleep[0].end,
            max: sleep[1].start
        };

        tabWidth = 0;
        sleepBarHeight = .75;

        self.stripLeftOffset = tabWidth;
        self.stripWidth = self.totalWidth - (2*self.stripLeftOffset);
        self.stripHeight = self.totalHeight - (sleepBarHeight*((.18*self.totalHeight)/sleepBarHeight));

        stripBarBorderRadius = .75;

        sleepBarWidth = self.stripWidth - (2*stripBarBorderRadius);
        sleepBarLeftOffset = self.stripLeftOffset + stripBarBorderRadius;
        sleepBarTopOffset = self.totalHeight - sleepBarHeight;

        tabHeight = self.stripHeight * (3/4);
        tabTopOffset = self.stripHeight * (1/8);

        eve.on("taskListUpdated", taskListUpdated);
    }

    function taskListUpdated(){
        if(taskManager.taskListIsValid()){
            drawBlocks();
        }
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

    self.draw = function(){

        var morningTab = drawingArea.rect(0, tabTopOffset, tabWidth, tabHeight);
        morningTab.attr({fill: "#f8b978"});

        var nightTab = drawingArea.rect(self.stripWidth+tabWidth, tabTopOffset, tabWidth, tabHeight);
        nightTab.attr({fill: "#37445c"});

        var strip = drawingArea.rect(self.stripLeftOffset, 0, self.stripWidth, self.stripHeight);
        strip.attr({"fill": "#7e3c46", "fill-opacity": .1});

        self.group.add(strip);
        drawBlocks();

        //apply the mask
        var roundedRectangleMask = drawingArea.rect(self.stripLeftOffset, 0, self.stripWidth, self.stripHeight);
        roundedRectangleMask.attr({rx: stripBarBorderRadius, ry: stripBarBorderRadius, fill: "white"});
        self.group.attr({mask: roundedRectangleMask});

        var sleepGradient = drawingArea.gradient("l(0, 0, 1, 0)#F8B978-#5C6879");
        var totalBar = drawingArea.rect(sleepBarLeftOffset, sleepBarTopOffset, sleepBarWidth, sleepBarHeight);
        var sleepBar = drawingArea.rect(sleepBarLeftOffset, sleepBarTopOffset, sleepBarWidth * calculateSleepBarScaleFactor(), sleepBarHeight);

        sleepBar.attr({rx: sleepBarHeight/2, ry: sleepBarHeight/2, "fill": sleepGradient});
        totalBar.attr({rx: sleepBarHeight/2, ry: sleepBarHeight/2, "fill": "#7e3c46", "fill-opacity": .1});

    };

    init();

    if(taskManager.taskListIsValid()){
        self.draw();
    }

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