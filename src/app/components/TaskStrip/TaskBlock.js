/**
 * Created by jordanbradley on 3/10/16.
 */

import { PiUtilities } from '../PiUtilities.js';



export function TaskBlock(TaskStrip, _taskID) {

    //construct

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
        terminalSeparationLine = drawingArea.path(),
        startSeparationLine = drawingArea.path(),
        blockGroup = drawingArea.g(),
        blockMask = drawingArea.path(),
        dragClone;

    var blockColorHeight = taskStrip.stripHeight * (1/22),
        handleWidth = 1.1;

    var canResizeAdjacentTaskByDraggingSeparationLine = null;
    var isInSingleSelectionMode = false;

    var single_selection_mode_class = "in-single-selection-mode";
    var task_block_class = "task-block";

    var blockAlreadyAnimating;

    var taskID = _taskID;


    blockGroup.addClass(task_block_class);
    blockGroup.add(block, blockTopColor, blockBottomColor, blockEmoji, blockStartingHandle, blockMiddleHandle, blockTerminalHandle, terminalSeparationLine, startSeparationLine);

    self.blockGroup = blockGroup;
    TaskStrip.group.add(blockGroup);

    attachUIHandlersAndEvents();

    function init(_taskID, _taskIndex) {

        self.startingPosition = 0;
        self.terminalPosition = 0;

        self.task = taskManager.getTask(_taskID);

        determineUIAbilitiesAndClasses();

        var drawingPosition = findBlockPosition();
        self.draw(drawingPosition.startingPosition, drawingPosition.terminalPosition);
    }

    function refreshTask(){
        self.task = taskManager.getTask(taskID);
    }

    function findBlockPosition(_task, start, end){
        var task = self.task || _task;

        //a decimal from 0-1 that when multipled by the width of the task strip give the pixel positions for drawing
        return {
            "startingPosition": PiUtilities.toLinearPosition0to1FromTimeOfDay(task.start || start, TaskStrip.scale.min, TaskStrip.scale.max) + TaskStrip.stripLeftOffset,
            "terminalPosition": PiUtilities.toLinearPosition0to1FromTimeOfDay(task.end || end, TaskStrip.scale.min, TaskStrip.scale.max) + TaskStrip.stripLeftOffset
        }
    }

    function canUserResizeAdjacentTask(){
        var adjacentTaskRight = taskManager.getTaskAtIndex(self.task.index + 1),
            adjacentTaskLeft = taskManager.getTaskAtIndex(self.task.index - 1);

        canResizeAdjacentTaskByDraggingSeparationLine =
            ((adjacentTaskRight && moment(adjacentTaskRight.start).isSame(moment(self.task.end)))
            || (adjacentTaskLeft) && moment(adjacentTaskLeft.end).isSame(moment(self.task.start)));
    }
    
    /*
    * since each block is recylced, we
    * need to re apply ui classes if neccessary
    * */
    function determineUIAbilitiesAndClasses(){
        canUserResizeAdjacentTask();
    }

    function attachUIHandlersAndEvents(){

        blockStartingHandle.drag(resizeTaskSliceByDraggingStartingHandle, null, cancelResizeTaskSliceByDraggingStartOrEndHandle);
        blockTerminalHandle.drag(resizeTaskSliceByDraggingTerminalHandle, null, cancelResizeTaskSliceByDraggingStartOrEndHandle);
        blockMiddleHandle.dblclick(selectTaskBlock);
        blockMiddleHandle.drag(moveTaskLeftOrRightByDraggingMiddleHandle, start_moveTaskLeftOrRightByDraggingMiddleHandle, endMoveTaskLeftOrRightByDraggingMiddleHandle);
        terminalSeparationLine.drag(resizeAdjacentTaskByDraggingSeparationLine);
        terminalSeparationLine.hover(highlightSeparationLineIfUserCanResizeAdjacentTaskByDraggingSeparationLine, unHighlightSeparationLine);
        eve.on("userDraggingTaskInSingleSelectionMode", determineIfTaskCanBeInsertedHere);
        eve.on("taskBlockSelected", selectTaskBlock);
    }

    /*
    * Misc temp variables
    * for drag and hover events.
    * */

    var minPushPullPosition = null,
        maxPushPullPosition = null,
        pushPullDirection = null,
        originalMiddleHandleStartPosition = null,
        running_dx = null;


    function _bringToFront(){
        var lastBlock = $('.task-block').last();
        $(self.blockGroup.node).insertAfter(lastBlock);
    }

    function _nextTaskStartOrScaleMax() {
        return self.task.index < taskManager.getTaskCount() - 1 ? taskManager.getTaskAtIndex(self.task.index + 1).start : taskStrip.scale.max;
    }

    function _prevTaskEndOrScaleMin() {
        var min;

        if(self.task.index == 0) {
            min = taskStrip.scale.min;
        }else if(self.task.index > 0){
            var prevTask = taskManager.getTaskAtIndex(self.task.index - 1);

            min = taskManager.getTaskAtIndex(self.task.index - 1).end;

            if(taskStrip.scale.truncated && moment(prevTask.start).isBefore(moment(taskStrip.scale.min))){
                min = taskStrip.scale.min;
            }

        }

        return min;
    }
    
    function _determineLimitsForPushPull(direction){
        
        var min, max;
        
        if(direction == "start"){

            if(minPushPullPosition === null){


                var originalStartPosition = self.startingPosition;
                var firstTaskStartPosition = PiUtilities.toLinearPosition0to1FromTimeOfDay(taskManager.getTaskAtIndex(1).start, taskStrip.scale.min, taskStrip.scale.max);
                var scaleMin = PiUtilities.toLinearPosition0to1FromTimeOfDay(taskStrip.scale.min, taskStrip.scale.min, taskStrip.scale.max);
                var originalSpaceBetweenFirstTaskAndScaleMin = firstTaskStartPosition - scaleMin;

                minPushPullPosition = originalStartPosition - originalSpaceBetweenFirstTaskAndScaleMin;

            }

            min = minPushPullPosition;
            max = PiUtilities.toLinearPosition0to1FromTimeOfDay(moment(self.task.end).subtract(taskManager.MINIMUM_TASK_SIZE, "minutes"), taskStrip.scale.min, taskStrip.scale.max);

        } else if(direction == "end"){

            if(maxPushPullPosition === null){

                var originalTerminalPosition = self.terminalPosition;
                var lastTaskTerminalPosition = PiUtilities.toLinearPosition0to1FromTimeOfDay(taskManager.getTaskAtIndex(taskManager.getTaskCount()-1).end, taskStrip.scale.min, taskStrip.scale.max);
                var scaleMax = PiUtilities.toLinearPosition0to1FromTimeOfDay(taskStrip.scale.max, taskStrip.scale.min, taskStrip.scale.max);
                var originalSpaceBetweenLastTaskAndScaleMax = lastTaskTerminalPosition - scaleMax;

                maxPushPullPosition = originalTerminalPosition - originalSpaceBetweenLastTaskAndScaleMax;

            }

            max = maxPushPullPosition;
            min = PiUtilities.toLinearPosition0to1FromTimeOfDay(moment(self.task.start).add(taskManager.MINIMUM_TASK_SIZE, "minutes"), taskStrip.scale.min, taskStrip.scale.max);
        }

        console.log("Direction: "+direction);

        return {minPosition: min, maxPosition: max}
    }
    
    function _clearLimitsForPushPull(){
        minPushPullPosition = null;
        maxPushPullPosition = null;
        pushPullDirection = null;
    }

    function _clearSingleSelection(){
        $('body').removeClass("task-block-selected");
        taskStrip.blocks.forEach(function(block) {
            block.blockGroup.removeClass("selected");
        });
    }

    function selectTaskBlock(idOrEvent, trigger) {

        var givenID = typeof idOrEvent == "string" && idOrEvent == self.task.id,
            clicked = idOrEvent instanceof MouseEvent;

        if(givenID || clicked){

            if(givenID){
                if(trigger == "api"){
                    eve('taskBlockSelected', {}, self.task.id, "api");
                    console.log("Selected via api call", self.task.name);
                }
            }

            if(clicked){
                if(trigger != "clicked"){
                    eve('taskBlockSelected', {}, self.task.id, "clicked");
                    console.log("Selected via click", self.task.name);
                }
            }

            _clearSingleSelection();
            $('body').addClass("task-block-selected");
            self.blockGroup.addClass("selected");
        }

        eve.on('userClickedOutsideOfStrip', _clearSingleSelection);

    }
    
    function pushPullTaskByHoldingShiftWhileDraggingMiddleHandle(dx, dy, mx, my, e){
        
        var scaled_dx = (dx * drawingArea.getCurrentPixelRatio().x)/taskStrip.stripWidth;
        var taskSize = PiUtilities.taskSize(self.task.start, self.task.end);
        var linearSize = PiUtilities.toLinearPosition0to1FromTimeOfDay(self.task.end, taskStrip.scale.min, taskStrip.scale.max) - PiUtilities.toLinearPosition0to1FromTimeOfDay(self.task.start, taskStrip.scale.min, taskStrip.scale.max)

        pushPullDirection = (e.altKey) ? "end" : "start";

        var farLimits = _determineLimitsForPushPull(pushPullDirection);

        var limits = {};

        console.log("Direction: "+pushPullDirection);

        if(pushPullDirection == "start"){

            limits.minPosition = farLimits.minPosition;
            limits.maxPosition = PiUtilities.toLinearPosition0to1FromTimeOfDay(moment(_nextTaskStartOrScaleMax()).subtract(taskSize, "minutes"), taskStrip.scale.min, taskStrip.scale.max);

        }else if(pushPullDirection == "end"){

            limits.minPosition = PiUtilities.toLinearPosition0to1FromTimeOfDay(moment(_prevTaskEndOrScaleMin()), taskStrip.scale.min, taskStrip.scale.max);
            limits.maxPosition = farLimits.maxPosition - linearSize;

        }

        //drawingArea.circle(limits.minPosition * taskStrip.stripWidth, 7, .5).attr({"fill": "green"});
        //drawingArea.circle(limits.maxPosition * taskStrip.stripWidth, 7, .5).attr({"fill": "red"});

        console.log("DX:" + dx);

        var newStartingPosition = drawingArea.limitUIValueIfNecessary((originalMiddleHandleStartPosition + scaled_dx), limits.minPosition, limits.maxPosition).limitedValue;

        self.task.tempData['prev-start'] = self.task.start;
        self.task.tempData['prev-end'] = self.task.end;

        self.task.start = PiUtilities.toTimeOfDayFromLinearPosition0to1(newStartingPosition, taskStrip.scale.min, taskStrip.scale.max);
        self.task.end = moment(self.task.start).add(taskSize, 'm').format();

        taskManager.updateTasks({
            tasks: [self.task.id],
            updateMethod: pushPullDirection+"-push-pull"
        });
        
    }


    function pushPullTaskByHoldingShiftWhileDraggingStartOrEndHandle(handle, dx, dy, mx, my) {

        //this = terminal mode or starting mode
        var handleKey = handle.split("-")[0],
            taskIDs = [self.task.id];

        var limits = _determineLimitsForPushPull(handleKey);

        var horizontalMousePosition = drawingArea.limitUIValueIfNecessary(
            PiUtilities.toLinearPosition0to1FromArbitraryXPosition(drawingArea.relativeMousePoints(mx, my).x, taskStrip.stripWidth),
            limits.minPosition,
            limits.maxPosition
        ).limitedValue;

        var newTime = PiUtilities.toTimeOfDayFromLinearPosition0to1(horizontalMousePosition, taskStrip.scale.min, taskStrip.scale.max);

        self.task.tempData['prev-' + handleKey] = self.task[handleKey];
        self.task[handleKey] = newTime;

        taskManager.updateTasks({
            tasks: taskIDs,
            updateMethod: handleKey + "-push-pull",
            fullUpdate: false
        });

        taskStrip.redraw();

    }

    function determineIfTaskCanBeInsertedHere(blockIndex, draggingTaskName, draggingStartingPosition, draggingTerminalPosition){
    }

    function start_moveTaskLeftOrRightByDraggingMiddleHandle(){
        _bringToFront();
        originalMiddleHandleStartPosition = self.startingPosition;
    }

    var prevMx,
        direction;

    function moveTaskLeftOrRightByDraggingMiddleHandle(dx, dy, mx, my, e){

        if(e.shiftKey){
            pushPullTaskByHoldingShiftWhileDraggingMiddleHandle(dx, dy, mx, my, e);
            return;
        }

        var scaled_dx = (dx * drawingArea.getCurrentPixelRatio().x)/taskStrip.stripWidth;
        var scaled_mx = drawingArea.relativeMousePoints(mx, my).x/taskStrip.stripWidth;

        var taskSize = PiUtilities.taskSize(self.task.start, self.task.end);

        var draggingTaskId = self.task.id;

        var diff = prevMx - scaled_mx;
        if(diff < 0){ direction = "forward" }
        else if(diff > 0){ direction = "backward" }

        var maxStartingPosition = PiUtilities.toLinearPosition0to1FromTimeOfDay(moment(_nextTaskStartOrScaleMax()).subtract(taskSize, 'minutes'), taskStrip.scale.min, taskStrip.scale.max);
        var minStartingPosition = PiUtilities.toLinearPosition0to1FromTimeOfDay(moment(_prevTaskEndOrScaleMin()), taskStrip.scale.min, taskStrip.scale.max);
        var newStartingPosition = drawingArea.limitUIValueIfNecessary((originalMiddleHandleStartPosition + scaled_dx), minStartingPosition, maxStartingPosition);

        var swap = taskStrip.blocks.find(function(block, blockIndex, blocksArray){
            var blockSize = PiUtilities.toLinearSize(block.task.start, block.task.end, taskStrip.scale.min, taskStrip.scale.max);
            if(draggingTaskId != block.task.id){
                if(direction == "forward" && scaled_mx > PiUtilities.toLinearPosition0to1FromTimeOfDay(self.task.start, taskStrip.scale.min, taskStrip.scale.max) && scaled_mx > block.startingPosition && scaled_mx < block.terminalPosition){
                    self.bend(.2);
                    if(scaled_mx > block.startingPosition + (blockSize*.55)){
                        taskManager.updateTasks({
                            tasks: [draggingTaskId, block.task.id],
                            updateMethod: "insert-after-ripple",
                            animate: true
                        });
                    }
                    return true;
                }else if(direction == "backward" && scaled_mx < PiUtilities.toLinearPosition0to1FromTimeOfDay(self.task.start, taskStrip.scale.min, taskStrip.scale.max) && scaled_mx > block.startingPosition && scaled_mx < block.terminalPosition){
                    self.bend(-.2);
                    if(scaled_mx < block.terminalPosition - (blockSize*.55)){
                        taskManager.updateTasks({
                            tasks: [draggingTaskId, block.task.id],
                            updateMethod: "insert-before-ripple",
                            animate: true
                        });
                    }
                    return true;
                }
            }
        });

        if(!swap){
            self.task.start = PiUtilities.toTimeOfDayFromLinearPosition0to1(newStartingPosition.limitedValue, taskStrip.scale.min, taskStrip.scale.max);
            self.task.end = moment(self.task.start).add(taskSize, 'm').format();
            self.redraw();
        }

        prevMx = scaled_mx;

        //drawingArea.circle(newStartingPosition.liveValue * taskStrip.stripWidth, 7, .5).attr({"fill": "blue"});
        //drawingArea.circle(scaled_mx, 7, .5).attr({"fill": "green"});
        //drawingArea.circle(minStartingPosition * taskStrip.stripWidth, 7, .5).attr({"fill": "red"});

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
            max: PiUtilities.toLinearPosition0to1FromTimeOfDay((moment(self.task.end).subtract(taskManager.MINIMUM_TASK_SIZE, 'minutes').format()), taskStrip.scale.min, taskStrip.scale.max),
            min: PiUtilities.toLinearPosition0to1FromTimeOfDay(_prevTaskEndOrScaleMin(), taskStrip.scale.min, taskStrip.scale.max)
        });

        self.task.start = PiUtilities.toTimeOfDayFromLinearPosition0to1(horizontalMousePosition, taskStrip.scale.min, taskStrip.scale.max);
        self.redraw();
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
            max: PiUtilities.toLinearPosition0to1FromTimeOfDay(_nextTaskStartOrScaleMax(), taskStrip.scale.min, taskStrip.scale.max),
            min: PiUtilities.toLinearPosition0to1FromTimeOfDay((moment(self.task.start).add(taskManager.MINIMUM_TASK_SIZE, 'minutes').format()), taskStrip.scale.min, taskStrip.scale.max)
        });

        self.task.end = PiUtilities.toTimeOfDayFromLinearPosition0to1(horizontalMousePosition, taskStrip.scale.min, taskStrip.scale.max);
        self.redraw();
    }

    function highlightSeparationLineIfUserCanResizeAdjacentTaskByDraggingSeparationLine(){
        console.log(canResizeAdjacentTaskByDraggingSeparationLine);
        if(canResizeAdjacentTaskByDraggingSeparationLine){
            terminalSeparationLine.attr({strokeWidth: .3, stroke: "#3fa9f5"});
        }
    }

    function unHighlightSeparationLine(){
        if(canResizeAdjacentTaskByDraggingSeparationLine){
            terminalSeparationLine.attr({strokeWidth: .2, stroke: "#e6e6e5"});
        }
    }

    function resizeAdjacentTaskByDraggingSeparationLine(dx, dy, mx, my, e){
        if(canResizeAdjacentTaskByDraggingSeparationLine){
            var adjacentTaskRight = taskManager.getTaskAtIndex(self.task.index + 1);
            var horizontalMousePosition = drawingArea.limitUIValueIfNecessary(
                PiUtilities.toLinearPosition0to1FromArbitraryXPosition(drawingArea.relativeMousePoints(mx, my).x, taskStrip.stripWidth),
                PiUtilities.toLinearPosition0to1FromTimeOfDay(taskManager.utilities.getTaskMinEndTime(self.task.index), taskStrip.scale.min, taskStrip.scale.max),
                PiUtilities.toLinearPosition0to1FromTimeOfDay(taskManager.utilities.getTaskMaxStartTime(self.task.index + 1), taskStrip.scale.min, taskStrip.scale.max)
            ).limitedValue;
            self.task.end = PiUtilities.toTimeOfDayFromLinearPosition0to1(horizontalMousePosition, taskStrip.scale.min, taskStrip.scale.max);
            adjacentTaskRight.start =  PiUtilities.toTimeOfDayFromLinearPosition0to1(horizontalMousePosition, taskStrip.scale.min, taskStrip.scale.max);
            taskManager.updateTasks();
        }
    }

    function endMoveTaskLeftOrRightByDraggingMiddleHandle() {

        taskManager.updateTasks();

        prevMx = null;
        direction = null;

        originalMiddleHandleStartPosition = null;
        _clearLimitsForPushPull();
    }

    function cancelResizeTaskSliceByDraggingStartOrEndHandle(e){

        taskManager.updateTasks({
            tasks: [self.task.id],
            updateMethod: "regular",
            animate: false
        });

        _clearLimitsForPushPull()
    }

    self.select = function(){

    }

    self.redraw = function(_animate){
        refreshTask();
        determineUIAbilitiesAndClasses();//re determine UI capabilities
        var drawingPosition = findBlockPosition(); //find the new drawing position
        var speed = _animate ? 300 : 0; //animate the redraw
        self.draw(drawingPosition.startingPosition, drawingPosition.terminalPosition, function () {}, speed); //draw
    };


    self.bend = function(_bendIntensity){
        self.draw(self.startingPosition, self.terminalPosition, null, null, _bendIntensity);
    };

    self.draw = function(_newStartingPosition, _newTerminalPosition, callback, _speed, _bendIntensity){

        var speed = _speed || 0;

        var startingPosition = self.startingPosition,
            terminalPosition = self.terminalPosition;

        function _applyAttributes(values) {

            var currentStartingPosition = values[0];
            var currentTerminalPosition = values[1];

            var drawingStartPosition = currentStartingPosition * taskStrip.stripWidth;
            var drawingTerminalPosition = currentTerminalPosition * taskStrip.stripWidth;

            var blockWidth = (drawingTerminalPosition-drawingStartPosition),
                padding = blockWidth * .25;

            var bend = _bendIntensity || 0;

            var sweep = bend > 0 ? 1 : 0,
                radiusY = 1,
                radiusX = radiusY*bend,
                move = "M"+drawingStartPosition+","+taskStrip.stripTopOffset,
                topLine = "L"+(drawingStartPosition + blockWidth)+","+taskStrip.stripTopOffset,
                arc = "A"+radiusX+","+radiusY+" 0  0 "+sweep+" "+(drawingStartPosition + blockWidth)+","+(taskStrip.stripTopOffset + taskStrip.stripHeight),
                bottomLine = "L"+drawingStartPosition+","+(taskStrip.stripTopOffset + taskStrip.stripHeight),
                arc2 = "A"+radiusX+","+radiusY+" 0  0 "+(sweep ? 0 : 1)+" "+drawingStartPosition+","+taskStrip.stripTopOffset+" z";

            var blockPath = [move, topLine, arc, bottomLine, arc2].join(" ");

            //the block itself
            block.attr({x: drawingStartPosition - (padding/2), y: taskStrip.stripTopOffset, width: blockWidth + padding, height: taskStrip.stripHeight, fill: "white"});

            //top and bottom strips
            blockTopColor.attr({x: drawingStartPosition - (padding/2), y: taskStrip.stripTopOffset, width: blockWidth + padding, height: blockColorHeight, fill: self.task.color || PiUtilities.colors.pieOrangeCream});
            blockBottomColor.attr({x: drawingStartPosition - (padding/2), y: (taskStrip.stripTopOffset + taskStrip.stripHeight) - blockColorHeight, width: blockWidth + padding, height: blockColorHeight, fill: self.task.color || PiUtilities.colors.pieOrangeCream});

            //handles
            blockStartingHandle.attr({x: drawingStartPosition, y: taskStrip.stripTopOffset, width: handleWidth, height: taskStrip.stripHeight, fill: "transparent", stroke: "transparent", "stroke-width": .1});
            blockTerminalHandle.attr({x: drawingTerminalPosition-handleWidth, y: taskStrip.stripTopOffset, width: handleWidth, height: taskStrip.stripHeight, fill: "transparent", stroke: "transparent", "stroke-width": .1});
            blockMiddleHandle.attr({x: drawingStartPosition+handleWidth, y:taskStrip.stripTopOffset, width: (blockWidth-(2*handleWidth)), height: taskStrip.stripHeight, fill:"transparent", stroke: "transparent", "stroke-width": .1});

            //separator lines
            var move = "M"+drawingStartPosition+","+taskStrip.stripTopOffset,
                arc = "A"+radiusX+","+radiusY+" 0 0 "+sweep+" "+drawingStartPosition+","+(taskStrip.stripTopOffset + taskStrip.stripHeight),
                startPath = [move, arc].join(" ");

            startSeparationLine.attr({d: startPath, "stroke-width": .3, "stroke": "#E5E5E5", fill: "transparent"});


            var move = "M"+(drawingStartPosition + blockWidth)+","+taskStrip.stripTopOffset,
                arc = "A"+radiusX+","+radiusY+" 0 0 "+sweep+" "+(drawingStartPosition + blockWidth)+","+(taskStrip.stripTopOffset + taskStrip.stripHeight),
                terminalPath = [move, arc].join(" ");

            terminalSeparationLine.attr({d: terminalPath, "stroke-width": .3, "stroke": "#E5E5E5", fill: "transparent"});

            //emoji
            if(self.task.type != "sleep"){
                var blockBox = block.getBBox(),
                    emojiSize = 2.1;

                if(blockEmoji){
                    blockEmoji.remove();
                }

                blockEmoji = drawingArea.image("app/assets/emojis/72x72/"+self.task.emoji || "1f0cf.png", blockBox.cx-(emojiSize/2) + radiusX, blockBox.cy-(emojiSize/2),  emojiSize, emojiSize);
                blockGroup.add(blockEmoji);
            }

            //apply mask
            blockMask.attr({d: blockPath, fill: "white"});
            self.blockGroup.attr({mask: blockMask})

        }

        if(speed > 0){

            if(blockAlreadyAnimating)
                return;

            blockAlreadyAnimating = true;
            Snap.animate([startingPosition, terminalPosition], [_newStartingPosition, _newTerminalPosition], function(values){
                _applyAttributes(values)
            }, speed, function(){
                self.startingPosition = _newStartingPosition;
                self.terminalPosition = _newTerminalPosition;
                blockAlreadyAnimating = false;
                if(callback)
                    callback();
            });

        }else{
            _applyAttributes([_newStartingPosition, _newTerminalPosition]);

            self.startingPosition = _newStartingPosition;
            self.terminalPosition = _newTerminalPosition;
        }


    };

    self.destroy = function(){
        blockGroup.remove();
        self = null;
    };

    init(_taskID);

}