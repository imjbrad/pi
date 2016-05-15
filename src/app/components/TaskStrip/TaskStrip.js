/**
 * Created by jordanbradley on 3/10/16.
 */

import { TaskBlock } from './TaskBlock';
import { ThreeSegmentButton } from './ThreeSegmentButton';
import  { PiUtilities } from '../PiUtilities';
import { Day } from '../DayHelper'

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

    var _selectedTask;

    var morningTab = drawingArea.rect(),
        nightTab = drawingArea.rect(),
        strip = drawingArea.rect(),
        roundedRectangleMask = drawingArea.rect(),
        sleepBarLabel = drawingArea.text(),
        sleepGradient = drawingArea.gradient("l(0, 0, 1, 0)#F8B978-#5C6879"),
        totalBar = drawingArea.rect(),
        sleepBar = drawingArea.rect(),
        morningSleepAdjustmentButton,
        nightSleepAdjustmentButton;

        self.group = drawingArea.g();
        self.group.add(strip);
        self.group.attr({mask: roundedRectangleMask});

    var now = moment(new Day().at("2:30pm"));

    function init() {

        viewBox = drawingArea.node.attributes[1].nodeValue.split(" ");

        self.taskManager = _taskManager;

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
        self.stripHeight = 12.5;

        sleepBarHeight = .81;

        sleepBarLabelTopOffset = self.totalHeight - sleepBarHeight;
        sleepBarLabelLeftOffset = stripBarBorderRadius;
        sleepBarLabelWidth = 0;
        sleepBarLabelTextSize = 1;
        sleepBarLabelHeight = sleepBarHeight;

        sleepBarWidth = self.stripWidth - (2*stripBarBorderRadius + sleepBarLabelWidth);
        sleepBarLeftOffset = (sleepBarLabelLeftOffset + sleepBarLabelWidth);
        sleepBarTopOffset = (self.totalHeight - sleepBarHeight) - 0.2;

        if(taskManager.taskListIsValid()){
            draw();
        }

        eve.on("taskListUpdated", taskListUpdated);

        strip.click(createNewTaskInEmptySpace);

        $(document).click(function(e){
            var target = e.target;
            if($("#MainSpace").is(target) || $("#Space").is(target)){
                eve("userClickedOutsideOfStrip");
                console.log("clicked outside of strip");
            }
        })
    }

    function taskListUpdated(_animateBlocks){
        console.log("Task list updated, redrawing");
        if(taskManager.taskListIsValid()){
            self.redraw(_animateBlocks);
        }
    }

    function determineScale(){

        var sleep = self.taskManager.getSleepDetails(),
            scaleStart = sleep.wakeUpTime,
            scaleEnd = sleep.bedTime,
            scaleTruncated = false;

        /*but you're creating a plan for
        today, you've obviously are already
        awake.. so the scale needs to start
        right now
        */

        var dayPlanIsForToday = moment(self.taskManager.getDay()).startOf("day").isSame(moment(now).startOf("day"));

        if(moment(sleep.wakeUpTime).isBefore(now) && dayPlanIsForToday){
            scaleStart = now.format();
            scaleTruncated = true;
            console.log("the user is planning today but wake up time has already passed. starting strip at current moment");
        }

        console.log("Scale", moment(scaleStart).format(PiUtilities.full_format), moment(scaleEnd).format(PiUtilities.full_format));

        return {
            truncated: scaleTruncated,
            min: scaleStart,
            max: scaleEnd
        };
    }

    function disableMorningSleepAdjustment() {
        morningSleepAdjustmentButton.hide();
    }

    function calculateSleepBarScaleFactor() {

        /*
        * find the amount of time betwen
        * todays bedTime and tomorrows
        * wake up time, if set
        * */

        var sleepTimeInMinutes = taskManager.getAnticipatedSleepTime();

        var sleepBarScaleFactor = sleepTimeInMinutes/self.taskManager.getSleepGoalInMinutes();

        if(sleepBarScaleFactor > 1)
            sleepBarScaleFactor = 1;

        return sleepBarScaleFactor;
    }

    self.selectedTaskBlock = function(id){

        if(id){
            _selectedTask = id;
            eve("taskBlockSelected", {}, id);
        }

        return _selectedTask;
    };

    self.redraw = function(_animateBlocks){
        self.scale = determineScale();
        draw(_animateBlocks);
    };

    function createNewTaskInEmptySpace(e, mx, my){
        var scaled_mx = drawingArea.relativeMousePoints(mx, my).x/self.stripWidth;
        var halfSize = PiUtilities.toLinearSizeFromTaskSize(taskManager.MINIMUM_TASK_SIZE + 10, self.scale.min, self.scale.max)/2;
        var startingPosition = scaled_mx - halfSize;

        var newTask = taskManager.addTask({
            name: "",
            start: PiUtilities.toTimeOfDayFromLinearPosition0to1(startingPosition, self.scale.min, self.scale.max),
            end: PiUtilities.toTimeOfDayFromLinearPosition0to1(scaled_mx + halfSize, self.scale.min, self.scale.max),
            emoji: '1f3c0.png',
            tempData: {}
        });

        eve("userAddedTaskByClickingStrip", {}, newTask);

    }

    function draw(_animateBlocks){

        morningTab.attr({x: 0, y: tabTopOffset, width: tabWidth, height: tabHeight, fill: "#f8b978"});
        nightTab.attr({x: self.stripWidth+tabWidth, y:tabTopOffset, width: tabWidth, height: tabHeight, fill: "#37445c"});

        strip.attr({x: self.stripLeftOffset, y: self.stripTopOffset, width: self.stripWidth, height: self.stripHeight, "fill": "#7e3c46", "fill-opacity": .1});


        //only create the buttons once
        if(!morningSleepAdjustmentButton){
            morningSleepAdjustmentButton = new ThreeSegmentButton(self, {
                x: self.sleepAdjustmentButtonLeftOffset,
                y: self.sleepAdjustmentButtonTopOffset,
                width: self.sleepAdjustmentButtonWidth,
                height: self.sleepAdjustmentButtonHeight,
                image: "assets/sun.png",
                leftIcon: "assets/plus.svg",
                rightIcon: "assets/minus.svg"
            });
            morningSleepAdjustmentButton.leftButton.click(wakeUpEarlier);
            morningSleepAdjustmentButton.rightButton.click(wakeUpLater);
        }

        if(!nightSleepAdjustmentButton){
            nightSleepAdjustmentButton = new ThreeSegmentButton(self, {
                x: (self.totalWidth-stripBarBorderRadius) - self.sleepAdjustmentButtonWidth,
                y: self.sleepAdjustmentButtonTopOffset,
                width: self.sleepAdjustmentButtonWidth,
                height: self.sleepAdjustmentButtonHeight,
                image: "assets/moon.png",
                leftIcon: "assets/minus.svg",
                rightIcon: "assets/plus.svg"
            });

            nightSleepAdjustmentButton.leftButton.click(goToBedEarlier);
            nightSleepAdjustmentButton.rightButton.click(goToBedLater);
        }

        if(self.scale.truncated) {
            disableMorningSleepAdjustment();
        }

        var tasks = taskManager.getTasks();

        tasks.forEach(function (task, index, array) {

            var block = self.blocks.find(function(block, blockIndex, blackArray){
                return block.task.id == task.id
            });

            if (!block) {
                block = new TaskBlock(self, task.id);
                self.blocks.push(block);
            } else {
                block.redraw(_animateBlocks);
            }

            console.log(block.task.name, block.task.id, block.task.index);

        });

        console.log(self.blocks);

        roundedRectangleMask.attr({x:self.stripLeftOffset, y:self.stripTopOffset, width: self.stripWidth, height: self.stripHeight, rx: stripBarBorderRadius, ry: stripBarBorderRadius, fill: "white"});

        //sleepBarLabel.attr({x: sleepBarLabelLeftOffset, y: sleepBarLabelTopOffset, text:"Sleep:", fontSize: 1.31, width: sleepBarLabelWidth, alignmentBaseline: "central", fontFamily: "apercu_medium", fill: "#808080"});

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

    function wakeUpLater() {
        //take away time for tasks in the morning
        console.log("waking up later");
        var sleep = taskManager.getSleepTasks();
        sleep[0].end = moment(sleep[0].end).add(30, "minutes").format();
        taskManager.updateTasks();
    }

    function goToBedEarlier() {
        //take away time for tasks in the morning
        console.log("go to bed earlier");
        taskManager.bedTime(moment(taskManager.bedTime()).subtract(30, "minutes").format());
        taskManager.updateTasks();
    }

    function goToBedLater() {
        //take away time for tasks in the morning
        console.log("go to bed later");
        taskManager.bedTime(moment(taskManager.bedTime()).add(30, "minutes").format());
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