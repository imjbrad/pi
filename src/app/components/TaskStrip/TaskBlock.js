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
        self.draw(drawingPosition.startingPosition, drawingPosition.terminalPosition);
        TaskStrip.group.add(blockGroup);

        console.log(drawingPosition.startingPosition);
    }

    function linkToTask(_taskIndex){
        self.taskIndex = _taskIndex != null ? _taskIndex : self.taskIndex;
        self.task = taskManager.getTask(self.taskIndex);
    }

    function findBlockPosition(_task){
        var task = self.task || _task;

        return {
            "startingPosition": (PieUtilities.toLinearPositionFromTimeOfDay(task.start, TaskStrip.scale.min, TaskStrip.scale.max) * TaskStrip.stripWidth) + TaskStrip.stripLeftOffset,
            "terminalPosition": (PieUtilities.toLinearPositionFromTimeOfDay(task.end, TaskStrip.scale.min, TaskStrip.scale.max) * TaskStrip.stripWidth) + TaskStrip.stripLeftOffset
        }
    }


    function attachUIHandlersAndEvents(){
        blockStartingHandle.drag(resizeTaskSliceByDraggingStartingHandle);
        blockTerminalHandle.drag(resizeTaskSliceByDraggingTerminalHandle);
        blockMiddleHandle.drag(moveTaskLeftOrRightByDraggingMiddleHandle);
    }

    function pushPullTaskByDraggingStartOrEndHandle(handle, dx, dy, mx, my){

        //this = terminal mode or starting mode
        var handleKey = handle.split("-")[0],
            taskIDs = [self.taskIndex],

            horizontalMousePosition = drawingArea.getUIValueFromMousePosition({
               mouseX: mx,
               mouseY: my,
               valueFn: (mx, my) => {return drawingArea.relativeMousePoints(mx, my).x}
            });


        var newTime = PieUtilities.toTimeOfDayFromLinearScale(horizontalMousePosition/100, taskStrip.scale.min, taskStrip.scale.max);

        self.task.tempData['prev-'+handleKey] = self.task[handleKey];
        self.task[handleKey] = newTime;

        taskManager.updateTasks(taskIDs, handleKey+"-push-pull");
    }

    var distanceFromStart = null;
    function moveTaskLeftOrRightByDraggingMiddleHandle(dx, dy, mx, my, e){

        var horizontalMousePosition = drawingArea.relativeMousePoints(mx, my).x;

        if(!distanceFromStart){
            var startingPosition = self.startingPosition;
            distanceFromStart = horizontalMousePosition - startingPosition;
        }

        var newStartingPosition = horizontalMousePosition - distanceFromStart;
        var taskSize = PieUtilities.taskSize(self.task.start, self.task.end);


        self.task.tempData['prev-start'] = self.task.start;
        self.task.tempData['prev-end'] = self.task.end;

        self.task.start = PieUtilities.toTimeOfDayFromLinearScale(newStartingPosition/100, taskStrip.scale.min, taskStrip.scale.max);
        self.task.end = moment(self.task.start).add(taskSize, 'm').format();

        if(e.shiftKey){
            if(dx > 0){
                taskManager.updateTasks([self.taskIndex], "start-push-pull");
            }else{
                taskManager.updateTasks([self.taskIndex], "end-push-pull");
            }
        }else{
            taskManager.updateTasks();
        }

    }

    function resizeTaskSliceByDraggingStartingHandle(dx, dy, mx, my, e){

        if(e.shiftKey){
            pushPullTaskByDraggingStartOrEndHandle("start-handle", dx, dy, mx, my);
            return;
        }

        var horizontalMousePosition = drawingArea.relativeMousePoints(mx, my).x;
        self.task.start = PieUtilities.toTimeOfDayFromLinearScale(horizontalMousePosition/100, taskStrip.scale.min, taskStrip.scale.max);
        taskManager.updateTasks();
    }

    function resizeTaskSliceByDraggingTerminalHandle(dx, dy, mx, my, e){

        if(e.shiftKey){
            pushPullTaskByDraggingStartOrEndHandle("end-handle", dx, dy, mx, my);
            return;
        }

        var tod = taskManager.getTask(self.taskIndex + 1).start;
        var linearPosition = PieUtilities.toLinearPositionFromTimeOfDay(tod, taskStrip.scale.min, taskStrip.scale.max);

        console.log(linearPosition, PieUtilities.toLinearPositionFromTimeOfDay(tod, taskStrip.scale.min, taskStrip.scale.max));

        var horizontalMousePosition = drawingArea.getUIValueFromMousePosition({
            mouseX: mx,
            mouseY: my,
            valueFn: (mx, my) => {return drawingArea.relativeMousePoints(mx, my).x/100},
            max: PieUtilities.toLinearPositionFromTimeOfDay(taskManager.getTask(self.taskIndex + 1).start, taskStrip.scale.min, taskStrip.scale.max),
            min: PieUtilities.toLinearPositionFromTimeOfDay((moment(self.task.start).add(taskManager.MINIMUM_TASK_SIZE, 'minutes').format()), taskStrip.scale.min, taskStrip.scale.max)
        });

        self.task.end = PieUtilities.toTimeOfDayFromLinearScale(horizontalMousePosition, taskStrip.scale.min, taskStrip.scale.max);
        taskManager.updateTasks();
    }

    self.redraw = function(_animate){
        //re link the block to its task
        linkToTask();
        //find the new drawing position
        var drawingPosition = findBlockPosition();
        var speed = _animate ? 200 : 0;
        //draw it
        self.draw(drawingPosition.startingPosition, drawingPosition.terminalPosition, function () {}, speed);
    };


    self.draw = function(startingPosition, terminalPosition){
        var blockWidth = terminalPosition-startingPosition;

        //the block itself
        block.attr({x: startingPosition, y: 0, width: blockWidth, height: taskStrip.stripHeight, fill: "white"});

        //top and bottom strips
        blockTopColor.attr({x: startingPosition, y: 0, width: blockWidth, height: blockColorHeight, fill: self.task.color || PieUtilities.colors.pieOrangeCream});
        blockBottomColor.attr({x: startingPosition, y: taskStrip.stripHeight - blockColorHeight, width: blockWidth, height: blockColorHeight, fill: self.task.color || PieUtilities.colors.pieOrangeCream});

        //handles
        blockStartingHandle.attr({x: startingPosition, y: 0, width: handleWidth, height: taskStrip.stripHeight, fill: "transparent", stroke: "transparent", "stroke-width": .1});
        blockTerminalHandle.attr({x: terminalPosition-handleWidth, y: 0, width: handleWidth, height: taskStrip.stripHeight, fill: "transparent", stroke: "transparent", "stroke-width": .1});
        blockMiddleHandle.attr({x: startingPosition+handleWidth, y:0, width: (blockWidth-(2*handleWidth)), height: taskStrip.stripHeight, fill:"transparent"});

        //separator line
        separationLine.attr({x1: terminalPosition, y1: blockColorHeight, x2: terminalPosition, y2: taskStrip.stripHeight-blockColorHeight, "stroke-width": .2, "stroke": "#e6e6e5"});

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

        self.startingPosition = startingPosition;
        self.terminalPosition = terminalPosition;

    };

    init(_blockIndex);

}