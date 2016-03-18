/**
 * Created by jordanbradley on 3/10/16.
 */

import { PieUtilities } from '../PiUtilities.js';



export function TaskBlock(TaskStrip, _blockIndex) {

    var self = this,
        taskStrip = TaskStrip,
        drawingArea  = TaskStrip.drawingArea,
        taskManager = TaskStrip.taskManager;

    var block = drawingArea.rect(),
        blockTopColor = drawingArea.rect(),
        blockBottomColor = drawingArea.rect(),
        blockEmoji = drawingArea.image(),
        blockStartingHandle = drawingArea.rect(),
        blockTerminalHandle = drawingArea.rect(),
        blockMiddleHandle = drawingArea.rect(),
        separationLine = drawingArea.line(),
        blockGroup = drawingArea.g();

    var blockColorHeight = taskStrip.stripHeight * (1/22),
        handleWidth = 1.1;

    blockGroup.add(block, separationLine, blockTopColor, blockBottomColor, blockEmoji, blockStartingHandle, blockMiddleHandle, blockTerminalHandle);

    function init(_blockIndex) {

        linkToTask(_blockIndex);
        attachUIHandlersAndEvents();

        var drawingPosition = findBlockPosition();
        self.drawStrip(drawingPosition.startingPosition, drawingPosition.terminalPosition);
        TaskStrip.group.add(blockGroup);
    }

    function linkToTask(_taskIndex){
        self.taskIndex = _taskIndex != null ? _taskIndex : self.taskIndex;
        self.task = taskManager.getTask(self.taskIndex);
    }

    function findBlockPosition(_task){
        var task = self.task || _task;

        //a decimal from 0-1 that when multipled by the width of the task strip give the pixel positions for drawing
        return {
            "startingPosition": PieUtilities.toLinearPosition0to1FromTimeOfDay(task.start, TaskStrip.scale.min, TaskStrip.scale.max) + TaskStrip.stripLeftOffset,
            "terminalPosition": PieUtilities.toLinearPosition0to1FromTimeOfDay(task.end, TaskStrip.scale.min, TaskStrip.scale.max) + TaskStrip.stripLeftOffset
        }
    }

    function attachUIHandlersAndEvents(){
        blockStartingHandle.drag(resizeTaskSliceByDraggingStartingHandle, null, cancelResizeTaskSliceByDraggingStartOrEndHandle);
        blockTerminalHandle.drag(resizeTaskSliceByDraggingTerminalHandle, null, cancelResizeTaskSliceByDraggingStartOrEndHandle);
        blockMiddleHandle.drag(moveTaskLeftOrRightByDraggingMiddleHandle, start_moveTaskLeftOrRightByDraggingMiddleHandle, cancelMoveTaskLeftOrRightByDraggingMiddleHandle);
    }

    /*
    * Misc temp variables
    * for drag events. Should
    * be cleared after each event
    * */

    var minPushPullPosition = null,
        maxPushPullPosition = null,
        pushPullDirection = null,
        originalMiddleHandleStartPosition = null;
    
    function _determineLimitsForPushPull(direction){
        
        var min, max;
        
        if(direction == "start"){

            if(minPushPullPosition === null){


                var originalStartPosition = self.startingPosition;
                var firstTaskStartPosition = PieUtilities.toLinearPosition0to1FromTimeOfDay(taskManager.getTask(1).start, taskStrip.scale.min, taskStrip.scale.max);
                var sleepTaskEndPosition = PieUtilities.toLinearPosition0to1FromTimeOfDay(taskManager.getTask(0).end, taskStrip.scale.min, taskStrip.scale.max);
                var originalSpaceBetweenFirstTaskAndScaleMin = firstTaskStartPosition - sleepTaskEndPosition;

                minPushPullPosition = originalStartPosition - originalSpaceBetweenFirstTaskAndScaleMin;

            }

            min = minPushPullPosition;
            max = PieUtilities.toLinearPosition0to1FromTimeOfDay(moment(self.task.end).subtract(taskManager.MINIMUM_TASK_SIZE, "minutes"), taskStrip.scale.min, taskStrip.scale.max);

        } else if(direction == "end"){

            if(maxPushPullPosition === null){

                var originalTerminalPosition = self.terminalPosition;
                var lastTaskTerminalPosition = PieUtilities.toLinearPosition0to1FromTimeOfDay(taskManager.getTask(1).start, taskStrip.scale.min, taskStrip.scale.max);
                var scaleMax = PieUtilities.toLinearPosition0to1FromTimeOfDay(taskManager.getTask(0).end, taskStrip.scale.min, taskStrip.scale.max);
                var originalSpaceBetweenLastTaskAndScaleMax = lastTaskTerminalPosition - scaleMax;

                maxPushPullPosition = originalTerminalPosition + originalSpaceBetweenLastTaskAndScaleMax
            }

            max = maxPushPullPosition;
            min = PieUtilities.toLinearPosition0to1FromTimeOfDay(moment(self.task.start).add(taskManager.MINIMUM_TASK_SIZE, "minutes"), taskStrip.scale.min, taskStrip.scale.max);
        }

        console.log("Direction: "+direction);

        return {minPosition: min, maxPosition: max}
    }
    
    function _clearLimitsForPushPull(){
        minPushPullPosition = null;
        maxPushPullPosition = null;
        pushPullDirection = null;
    }
    
    function pushPullTaskByHoldingShiftWhileDraggingMiddleHandle(dx, dy, mx, my, e){
        
        var scaled_dx = (dx * drawingArea.getCurrentPixelRatio().x)/taskStrip.stripWidth;
        var taskSize = PieUtilities.taskSize(self.task.start, self.task.end);
        var linearSize = PieUtilities.toLinearPosition0to1FromTimeOfDay(self.task.end, taskStrip.scale.min, taskStrip.scale.max) - PieUtilities.toLinearPosition0to1FromTimeOfDay(self.task.start, taskStrip.scale.min, taskStrip.scale.max)

        if(!pushPullDirection)
            pushPullDirection = (dx > 0) ? "start" : "end";

        var farLimits = _determineLimitsForPushPull(pushPullDirection);

        var limits = {};

        console.log("Direction: "+pushPullDirection);

        if(pushPullDirection == "start"){

            limits.minPosition = farLimits.minPosition;
            limits.maxPosition = PieUtilities.toLinearPosition0to1FromTimeOfDay(moment(taskManager.getTask(self.taskIndex + 1).start).subtract(taskSize, "minutes"), taskStrip.scale.min, taskStrip.scale.max);

        }else if(pushPullDirection == "end"){

            limits.minPosition = PieUtilities.toLinearPosition0to1FromTimeOfDay(moment(taskManager.getTask(self.taskIndex - 1).end), taskStrip.scale.min, taskStrip.scale.max);
            limits.maxPosition = farLimits.maxPosition - linearSize;

        }

        drawingArea.circle(limits.minPosition * taskStrip.stripWidth, 7, .5).attr({"fill": "green"});
        drawingArea.circle(limits.maxPosition * taskStrip.stripWidth, 7, .5).attr({"fill": "red"});

        console.log("DX:" + dx);

        var newStartingPosition = drawingArea.limitUIValueIfNecessary((originalMiddleHandleStartPosition + scaled_dx), limits.minPosition, limits.maxPosition);

        self.task.tempData['prev-start'] = self.task.start;
        self.task.tempData['prev-end'] = self.task.end;

        self.task.start = PieUtilities.toTimeOfDayFromLinearPosition0to1(newStartingPosition, taskStrip.scale.min, taskStrip.scale.max);
        self.task.end = moment(self.task.start).add(taskSize, 'm').format();

        taskManager.updateTasks([self.taskIndex], pushPullDirection+"-push-pull");
        
    }


    function pushPullTaskByHoldingShiftWhileDraggingStartOrEndHandle(handle, dx, dy, mx, my) {

        //this = terminal mode or starting mode
        var handleKey = handle.split("-")[0],
            taskIDs = [self.taskIndex];

        var limits = _determineLimitsForPushPull(handleKey);

        var horizontalMousePosition = drawingArea.limitUIValueIfNecessary(
            PieUtilities.toLinearPosition0to1FromArbitraryXPosition(drawingArea.relativeMousePoints(mx, my).x, taskStrip.stripWidth),
            limits.minPosition,
            limits.maxPosition
        );

        var newTime = PieUtilities.toTimeOfDayFromLinearPosition0to1(horizontalMousePosition, taskStrip.scale.min, taskStrip.scale.max);

        self.task.tempData['prev-' + handleKey] = self.task[handleKey];
        self.task[handleKey] = newTime;

        taskManager.updateTasks(taskIDs, handleKey + "-push-pull");
    }

    function start_moveTaskLeftOrRightByDraggingMiddleHandle(){
        originalMiddleHandleStartPosition = self.startingPosition;
    }

    function moveTaskLeftOrRightByDraggingMiddleHandle(dx, dy, mx, my, e){

        if(e.shiftKey){
            pushPullTaskByHoldingShiftWhileDraggingMiddleHandle(dx, dy, mx, my, e);
            return;
        }
        
        var scaled_dx = (dx * drawingArea.getCurrentPixelRatio().x)/taskStrip.stripWidth;

        var taskSize = PieUtilities.taskSize(self.task.start, self.task.end);

        var maxStartingPosition = PieUtilities.toLinearPosition0to1FromTimeOfDay(moment(taskManager.getTask(self.taskIndex + 1).start).subtract(taskSize, 'minutes'), taskStrip.scale.min, taskStrip.scale.max);
        var minStartingPosition = PieUtilities.toLinearPosition0to1FromTimeOfDay(taskManager.getTask(self.taskIndex - 1).end, taskStrip.scale.min, taskStrip.scale.max);
        
        var newStartingPosition = drawingArea.limitUIValueIfNecessary((originalMiddleHandleStartPosition + scaled_dx), minStartingPosition, maxStartingPosition);

        self.task.tempData['prev-start'] = self.task.start;
        self.task.tempData['prev-end'] = self.task.end;

        self.task.start = PieUtilities.toTimeOfDayFromLinearPosition0to1(newStartingPosition, taskStrip.scale.min, taskStrip.scale.max);
        self.task.end = moment(self.task.start).add(taskSize, 'm').format();

        taskManager.updateTasks();


    }

    function resizeTaskSliceByDraggingStartingHandle(dx, dy, mx, my, e){

        if(e.shiftKey){
            pushPullTaskByHoldingShiftWhileDraggingStartOrEndHandle("start-handle", dx, dy, mx, my);
            return;
        }

        var horizontalMousePosition = drawingArea.getUIValueFromMousePosition({
            mouseX: mx,
            mouseY: my,
            valueFn: (mx, my) => {return drawingArea.relativeMousePoints(mx, my).x/taskStrip.stripWidth},
            max: PieUtilities.toLinearPosition0to1FromTimeOfDay((moment(self.task.end).subtract(taskManager.MINIMUM_TASK_SIZE, 'minutes').format()), taskStrip.scale.min, taskStrip.scale.max),
            min: PieUtilities.toLinearPosition0to1FromTimeOfDay(taskManager.getTask(self.taskIndex - 1).end, taskStrip.scale.min, taskStrip.scale.max)
        });

        self.task.start = PieUtilities.toTimeOfDayFromLinearPosition0to1(horizontalMousePosition, taskStrip.scale.min, taskStrip.scale.max);
        taskManager.updateTasks();
    }

    function resizeTaskSliceByDraggingTerminalHandle(dx, dy, mx, my, e){

        if(e.shiftKey){
            pushPullTaskByHoldingShiftWhileDraggingStartOrEndHandle("end-handle", dx, dy, mx, my);
            return;
        }

        var horizontalMousePosition = drawingArea.getUIValueFromMousePosition({
            mouseX: mx,
            mouseY: my,
            valueFn: (mx, my) => {return drawingArea.relativeMousePoints(mx, my).x/taskStrip.stripWidth},
            max: PieUtilities.toLinearPosition0to1FromTimeOfDay(taskManager.getTask(self.taskIndex + 1).start, taskStrip.scale.min, taskStrip.scale.max),
            min: PieUtilities.toLinearPosition0to1FromTimeOfDay((moment(self.task.start).add(taskManager.MINIMUM_TASK_SIZE, 'minutes').format()), taskStrip.scale.min, taskStrip.scale.max)
        });

        self.task.end = PieUtilities.toTimeOfDayFromLinearPosition0to1(horizontalMousePosition, taskStrip.scale.min, taskStrip.scale.max);
        taskManager.updateTasks();
    }

    function cancelMoveTaskLeftOrRightByDraggingMiddleHandle() {
        originalMiddleHandleStartPosition = null;
        _clearLimitsForPushPull();
    }

    function cancelResizeTaskSliceByDraggingStartOrEndHandle(e){
        _clearLimitsForPushPull()
    }

    self.redraw = function(_animate){
        //re link the block to its task
        linkToTask();
        //find the new drawing position
        var drawingPosition = findBlockPosition();
        var speed = _animate ? 200 : 0;
        //draw it
        self.drawStrip(drawingPosition.startingPosition, drawingPosition.terminalPosition, function () {}, speed);
    };


    self.drawStrip = function(_startingPosition, _terminalPosition){

        var startingPosition0to1 = _startingPosition;
        var terminalPosition0to1 = _terminalPosition;

        var drawingStartPosition = _startingPosition * taskStrip.stripWidth;
        var drawingTerminalPosition = _terminalPosition * taskStrip.stripWidth;

        var blockWidth = drawingTerminalPosition-drawingStartPosition;

        //the block itself
        block.attr({x: drawingStartPosition, y: taskStrip.stripTopOffset, width: blockWidth, height: taskStrip.stripHeight, fill: "white"});

        //top and bottom strips
        blockTopColor.attr({x: drawingStartPosition, y: taskStrip.stripTopOffset, width: blockWidth, height: blockColorHeight, fill: self.task.color || PieUtilities.colors.pieOrangeCream});
        blockBottomColor.attr({x: drawingStartPosition, y: (taskStrip.stripTopOffset + taskStrip.stripHeight) - blockColorHeight, width: blockWidth, height: blockColorHeight, fill: self.task.color || PieUtilities.colors.pieOrangeCream});

        //handles
        blockStartingHandle.attr({x: drawingStartPosition, y: taskStrip.stripTopOffset, width: handleWidth, height: taskStrip.stripHeight, fill: "transparent", stroke: "transparent", "stroke-width": .1});
        blockTerminalHandle.attr({x: drawingTerminalPosition-handleWidth, y: taskStrip.stripTopOffset, width: handleWidth, height: taskStrip.stripHeight, fill: "transparent", stroke: "transparent", "stroke-width": .1});
        blockMiddleHandle.attr({x: drawingStartPosition+handleWidth, y:taskStrip.stripTopOffset, width: (blockWidth-(2*handleWidth)), height: taskStrip.stripHeight, fill:"transparent"});

        //separator line
        separationLine.attr({x1: drawingTerminalPosition, y1: blockColorHeight, x2: drawingTerminalPosition, y2: (taskStrip.stripTopOffset + taskStrip.stripHeight) - blockColorHeight, "stroke-width": .2, "stroke": "#e6e6e5"});

        //emoji
        if(self.task.type != "sleep"){
            var blockBox = block.getBBox(),
                emojiSize = 2.1;

            if(blockEmoji){
                blockEmoji.remove();
            }

            blockEmoji = drawingArea.image("app/assets/emojis/72x72/"+self.task.emoji || "1f0cf.png", blockBox.cx-(emojiSize/2), blockBox.cy-(emojiSize/2),  emojiSize, emojiSize);
            blockGroup.add(blockEmoji);
        }

        self.startingPosition = startingPosition0to1;
        self.terminalPosition = terminalPosition0to1;



    };

    init(_blockIndex);

}