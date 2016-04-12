import { PiUtilities } from './PiUtilities.js';

//translate the mouse coordinates to the svg viewbox coordinates
function findRelativeMousePoints(mx, my, TaskDonut){
  var root = TaskDonut.svgNode[0];
  var mousePoint = root.createSVGPoint();
  mousePoint.x = mx;
  mousePoint.y = my;
  return mousePoint.matrixTransform(TaskDonut.p.node.getScreenCTM().inverse());
}

function findRelativeMouseAngle(mx, my, TaskDonut){
  var mousePoint = findRelativeMousePoints(mx, my, TaskDonut);
  var relative_mx = mousePoint.x;
  var relative_my = mousePoint.y;
  var relative_center_x = TaskDonut.centerX;
  var relative_center_y = TaskDonut.centerY;
  var mouseAngle = Math.atan2(relative_my - relative_center_y, relative_mx - relative_center_x).mod(Math.TWOPI);
  return Math.round(Snap.deg(mouseAngle));
}

export function TaskSlice(TaskDonut, _sliceIndex) {

  //private
  var self = this;
  var HANDLE_SLICE_SIZE = 3;
  var taskManager = TaskDonut.taskManager;
  var patternImg = TaskDonut.drawingArea.image("http://www.transparenttextures.com/patterns/debut-light.png", 0, 0, 100, 100).attr({"opacity": 1});
  var pattern = patternImg.toPattern(0, 0, 100, 100);
  var sleepGradient = TaskDonut.drawingArea.gradient("l(0, 0, 1, 0)#F8B978-#5C6879");
  var mainSlicePath;
  var singleSelectionMode;
  var lastValidatedMouseAngle;
  var pausingLiveAngleWhileTaskListIsDirty;
  var jointResizeMode;
  var jointResizeTimeout;
  var sliceAlreadyAnimating;
  var distanceFromStart;

  //exposed
  self.borderSlice = TaskDonut.drawingArea.path();
  self.mainSlice = TaskDonut.drawingArea.path();
  self.tempSlice = TaskDonut.drawingArea.path();
  self.terminalHandle = TaskDonut.drawingArea.path();
  self.startingHandle = TaskDonut.drawingArea.path();
  self.innerStartingVectorLine = TaskDonut.drawingArea.line();
  self.innerTerminalVectorLine = TaskDonut.drawingArea.line();
  self.label = TaskDonut.drawingArea.text();
  self.mainSliceRadius = TaskDonut.sliceBorderRadius;
  self.emojiRadius =  self.mainSliceRadius/1.1;
  self.tempData = {};

  TaskDonut.donut_group.add(
      self.borderSlice,
      self.mainSlice,
      self.innerStartingVectorLine,
      self.innerTerminalVectorLine,
      self.label,
      self.startingHandle,
      self.terminalHandle
  );

  function init(_sliceIndex){

    self.startingAngle = 0;
    self.terminalAngle = 0;

    linkTask(_sliceIndex);
    attachUIHandlersAndEvents();
    attachUIClasses();

    var drawingAngles = findDrawingAngles();
    self.drawStrip(drawingAngles.startingAngle, drawingAngles.terminalAngle);

  }

  function linkTask(_index){
    self.taskIndex = _index != null ? _index : self.taskIndex;
    self.task = taskManager.getTask(self.taskIndex);
  }

  function attachUIHandlersAndEvents(){
    self.startingHandle.drag(resizeTaskSliceByDraggingStartingHandle);
    self.terminalHandle.drag(resizeTaskSliceByDraggingTerminalHandle);
    self.terminalHandle.dblclick(resizeTaskJointByDoubleClickingAndDragging);
    self.mainSlice.dblclick(enableSingleSelectionMode);

    $(document).click(function(e){
      var relativePoint = findRelativeMousePoints(e.pageX, e.pageY, TaskDonut);
      if(!Snap.path.isPointInside(mainSlicePath, relativePoint.x, relativePoint.y)){
        $(self.mainSlice.node).trigger("clicked-outside");
      }
    });

    eve.on("userIsDraggingSliceInSingleSelectionMode", userIsDraggingSliceInSingleSelectionMode);
    eve.on("userReleasedSliceInSingleSelectionMode", userReleasedSliceInSingleSelectionMode);
  }

  function attachUIClasses(){
    self.mainSlice.addClass("main-slice");
  }

  function findDrawingAngles(_task){
    var task = self.task || _task;
    return {
      "startingAngle": Snap.rad(PiUtilities.toAngle(task.start)).mod(Math.TWOPI),
      "terminalAngle": Snap.rad(PiUtilities.toAngle(task.end)).mod(Math.TWOPI)
    }
  }
  
  function findVectors(_startingAngle, _terminalAngle){

    var angleSize = _terminalAngle - _startingAngle;

    return {
      startingVector: TaskDonut.toXY(_startingAngle, TaskDonut.radius),
      terminalVector: TaskDonut.toXY(_terminalAngle, TaskDonut.radius),
      innerStartingVector : TaskDonut.toXY(_startingAngle, self.mainSliceRadius),
      innerTerminalVector : TaskDonut.toXY(_terminalAngle, self.mainSliceRadius),
      startingHandleStartingVector : TaskDonut.toXY(_startingAngle + Snap.rad(HANDLE_SLICE_SIZE), TaskDonut.radius),
      startingHandleTerminalVector : TaskDonut.toXY(_startingAngle, TaskDonut.radius),
      terminalHandleStartingVector : TaskDonut.toXY(_terminalAngle - Snap.rad(HANDLE_SLICE_SIZE), TaskDonut.radius),
      terminalHandleTerminalVector : TaskDonut.toXY(_terminalAngle, TaskDonut.radius),
      emojiVector: TaskDonut.toXY(_startingAngle + (angleSize/2), self.emojiRadius)
    }
  }

  function makeBorderSliceString(outerStartX, outerStartY, outerRadius, outerEndX, outerEndY, innerStartX, innerStartY, innerRadius, innerEndX, innerEndY, _sweep){

    var sweep = _sweep,
        move = "M"+innerStartX+","+innerStartY,
        arc = "A"+innerRadius+","+innerRadius+" 0 "+sweep+" 1 "+innerEndX+","+innerEndY,
        lineTo = "L"+outerEndX+","+outerEndY,
        outerArc = "A"+outerRadius+","+outerRadius+" 0 "+sweep+" 0 "+outerStartX+","+outerStartY,
        close = "L"+innerStartX+","+innerStartY+" z";

    return [move, arc, lineTo, outerArc, close].join(" ");
  }

  function makeSliceString(startX, startY, terminalX, terminalY, radius){

    var startingMoveTo = "M"+TaskDonut.centerX+","+TaskDonut.centerY,
        startingLineTo = "L"+startX+","+startY,
        startingArc = "A"+radius+","+radius+" 0 0 1 "+terminalX+","+terminalY+" z";

    return [startingMoveTo, startingLineTo, startingArc].join(" ");
  }

  function useLiveMouseAngleOrAPreviouslyValidAngle(mx, my){

    var liveAngle = findRelativeMouseAngle(mx, my, TaskDonut);
    var sign = lastValidatedMouseAngle - liveAngle;
    var angle = liveAngle;

    if(taskManager.taskListIsDirty()){
      pausingLiveAngleWhileTaskListIsDirty = false;
      if(sign < 0 && liveAngle >= lastValidatedMouseAngle){
        angle = lastValidatedMouseAngle;
        console.log("moving too far forward, using last successful angle");
        pausingLiveAngleWhileTaskListIsDirty = true;
      }
      if(sign > 0 && liveAngle <= lastValidatedMouseAngle){
        angle = lastValidatedMouseAngle;
        console.log("going to far backward, using last successful angle");
        pausingLiveAngleWhileTaskListIsDirty = true;
      }
    } else {
      console.log("using live angle");
      lastValidatedMouseAngle = liveAngle;
      pausingLiveAngleWhileTaskListIsDirty = false;
    }

    return angle;
  }

  function resizeTaskSliceByDraggingStartingHandle(){
    resizeTaskSliceByDraggingHandle.apply("start-handle", arguments);
  }

  function resizeTaskSliceByDraggingTerminalHandle(){
    resizeTaskSliceByDraggingHandle.apply("end-handle", arguments);
  }

  function disableSingleSelectionMode(){
    console.log("Disable single selection mode");
    singleSelectionMode = false;
    distanceFromStart = null;
    lastValidatedMouseAngle = null;

    $(self.mainSlice.node).off("clicked-outside");
    self.mainSlice.undrag();
    _clearDragHandlers();
    _attachDefaultDragHandlers();
    self.mainSlice.removeClass("single-selection-mode-enabled");
    console.log("Single Selection Mode Off");
  }

  function enableSingleSelectionMode() {
    singleSelectionMode = true;
    console.log("Single Selection Mode On");

    _clearDragHandlers();

    self.mainSlice.addClass("single-selection-mode-enabled");

    self.terminalHandle.drag(function(dx, dy, mx, my){
      var mouseAngle = findRelativeMouseAngle(mx, my, TaskDonut);
      self.task.end = PiUtilities.toTimeOfDay(mouseAngle).format();
      taskManager.updateTasks();
    });

    self.startingHandle.drag(function(dx, dy, mx, my){
      var mouseAngle = findRelativeMouseAngle(mx, my, TaskDonut);
      self.task.start = PiUtilities.toTimeOfDay(mouseAngle).format();
      taskManager.updateTasks();
    });

    self.mainSlice.drag(function(dx, dy, mx, my) {

      var mouseAngle = useLiveMouseAngleOrAPreviouslyValidAngle(mx, my);

      if(!distanceFromStart){
        var startingAngle = Snap.deg(self.startingAngle);
        distanceFromStart = mouseAngle - startingAngle;
      }

      var newStartAngle = mouseAngle - distanceFromStart;
      var taskSize = PiUtilities.taskSize(self.task.start, self.task.end);
      self.task.start = PiUtilities.toTimeOfDay(newStartAngle).format();
      self.task.end = moment(self.task.start).add(taskSize, 'm').format();

      taskManager.updateTasks();

      eve("userIsDraggingSliceInSingleSelectionMode", {}, self.task.id);

    }, null, function(){
      eve("userReleasedSliceInSingleSelectionMode", {}, self.task.id);
      disableSingleSelectionMode();
    });

    $(self.mainSlice.node).on("clicked-outside", function(){
      disableSingleSelectionMode();
    });

  }

  function userIsDraggingSliceInSingleSelectionMode(taskID){
    if(taskID != self.task.id && taskManager.taskListIsDirty()){
      self.terminalHandle.hover(function(){
        self.innerTerminalVectorLine.addClass("swap-mode-enabled");
      }, function(){
        self.innerTerminalVectorLine.removeClass("swap-mode-enabled");
      });
      self.startingHandle.hover(function(){
        self.innerStartingVectorLine.addClass("swap-mode-enabled");
      }, function(){
        self.innerStartingVectorLine.removeClass("swap-mode-enabled");
      });
    }
  }

  function userReleasedSliceInSingleSelectionMode(taskID){
    if(taskID != self.task.id && taskManager.taskListIsDirty()){
      if(self.innerTerminalVectorLine.hasClass("swap-mode-enabled")){
        console.log("can drop at "+self.task.name+" terminal");
        taskManager.updateTasks([taskID, self.task.id], "insert-after-ripple", true);
      }
      else if(self.innerStartingVectorLine.hasClass("swap-mode-enabled")){
        console.log("can drop at "+self.task.name+" starting");
        taskManager.updateTasks([taskID, self.task.id], "insert-before-ripple", true);
      }
    }
  }

  function _cancelJointResizeMode(){
    jointResizeMode = false;
    _cancelJointResizeTimeout();
    _clearDragHandlers();
    _attachDefaultDragHandlers();
    console.log("canceled joint mode");
  }

  function _cancelJointResizeTimeout(){
    window.clearTimeout(jointResizeTimeout);
  }

  function _setJointResizeTimeout(){
    _clearDragHandlers();
    //jointResizeTimeout = window.setTimeout(() => {_cancelJointResizeMode()}, 500);
  }

  function _clearDragHandlers(){
    self.terminalHandle.undrag();
    self.startingHandle.undrag();
  }

  function _attachDefaultDragHandlers(){
    self.startingHandle.drag(resizeTaskSliceByDraggingStartingHandle);
    self.terminalHandle.drag(resizeTaskSliceByDraggingTerminalHandle);
  }

  function _resetJointResizeTimeout(){
    _cancelJointResizeMode();
    _setJointResizeTimeout();
  }

  function resizeTaskJointByDoubleClickingAndDragging(){

    console.log("double click attempt to start join mode");

    var nextTask = taskManager.getTask(self.task.id + 1),
        nextTaskStart = nextTask.start;

    if((nextTask && (moment(nextTaskStart).isSame(self.task.end)))) {
      jointResizeMode = "initiated";
      console.log("joint mode enabled");
      _clearDragHandlers();

      self.terminalHandle.drag(

          function drag(dx, dy, mx, my) {

            jointResizeMode = true;
            console.log("dragging in resize joint mode");

            nextTask = taskManager.getTask(self.task.id + 1);
            nextTaskStart = nextTask.start;

            var relativeMousePoint = findRelativeMousePoints(mx, my, TaskDonut);
            var angle = findRelativeMouseAngle(relativeMousePoint.x, relativeMousePoint.y, TaskDonut); //_lastSuccessfulUIAngle("end-handle", mx, my);

            self.task.end = PiUtilities.toTimeOfDay(angle).format();
            nextTask.start = PiUtilities.toTimeOfDay(angle).format();
            //console.log("setting me "+self.task.name+" to:"+angle);
            //console.log("setting "+nextTask.name+" to:"+angle);

            taskManager.updateTasks();
          },

          function startDrag() {
            _cancelJointResizeTimeout();
          },

          function endDrag() {
            _cancelJointResizeMode();
          });

      self.terminalHandle.click(function(){

      });
    }

  }

  function resizeTaskSliceByDraggingHandle(dx, dy, mx, my){

    //this = terminal mode or starting mode
    var handleKey = this;
    var handleKey = handleKey.split("-")[0];
    var taskIDs = [self.taskIndex];
    var liveAngle = findRelativeMouseAngle(mx, my, TaskDonut);
    var liveTime = PiUtilities.toTimeOfDay(liveAngle);

    var prevHandleValue = self.task[handleKey];

    if(taskManager.taskListIsDirty()){
      console.log("dragging while the the task list is dirty");
      self.task[handleKey] = liveTime.format();
      if(taskManager.utilities.taskIsValid(self.task)){
        console.log("the new live angle would pass, should use live value "+liveAngle);
      }else{
        self.task[handleKey] = prevHandleValue;
        return false;
      }
    }

    self.task.tempData['prev-'+handleKey] = prevHandleValue;
    self.task[handleKey] = liveTime.format();
    TaskDonut.taskManager.updateTasks(taskIDs, handleKey+"-push-pull");

  }

  self.redraw = function(_animate){
    linkTask();

    console.log("Animate the redraw? ", _animate);

    var drawingAngles = findDrawingAngles();
    var speed = _animate ? 200 : 0;

    self.drawStrip(drawingAngles.startingAngle, drawingAngles.terminalAngle, function () {
    }, speed);

  };


  self.drawStrip = function (newStartAngle, newEndAngle, callback, _speed){
    var speed = _speed || 0;
    return Snap.animate([self.startingAngle, self.terminalAngle], [newStartAngle, newEndAngle], function(val){

      console.log("Animating");
      sliceAlreadyAnimating = true;

      var currentStartAngle = val[0];
      var currentEndAngle = val[1];

      var vectors = findVectors(currentStartAngle, currentEndAngle);
      var sweep = (currentEndAngle - currentStartAngle > Math.PI) ? 1 : 0;

      var slice = makeSliceString(
          vectors.innerStartingVector.x, vectors.innerStartingVector.y,
          vectors.innerTerminalVector.x, vectors.innerTerminalVector.y, self.mainSliceRadius
      );

      mainSlicePath = slice;

      //border slice
      var borderSlice = makeBorderSliceString(
          vectors.startingVector.x, vectors.startingVector.y,
          TaskDonut.radius, vectors.terminalVector.x,
          vectors.terminalVector.y, vectors.innerStartingVector.x,
          vectors.innerStartingVector.y, self.mainSliceRadius,
          vectors.innerTerminalVector.x, vectors.innerTerminalVector.y, sweep
      );

      var startingHandleSlice = makeSliceString(
          vectors.startingHandleStartingVector.x, vectors.startingHandleStartingVector.y,
          vectors.startingHandleTerminalVector.x, vectors.startingHandleTerminalVector.y, TaskDonut.radius
      );

      var terminalHandleSlice = makeSliceString(
          vectors.terminalHandleStartingVector.x, vectors.terminalHandleStartingVector.y,
          vectors.terminalHandleTerminalVector.x, vectors.terminalHandleTerminalVector.y, TaskDonut.radius
      );

      //var labelBBox = self.label.getBBox();
      //self.label.attr({text: self.task.name, x: vectors.emojiVector.x, y: vectors.emojiVector.y, 'font-size': 4});
      //self.label.attr({transform: "rotate("+(-TaskDonut.angle_offset) + " " + labelBBox.cx +" "+labelBBox.cy+")"});

      if(self.task.type != "sleep"){
        var emojiBBox;

        if(self.emoji){
          self.emoji.remove();
        }

        self.emoji = TaskDonut.drawingArea.image("app/assets/emojis/72x72/"+self.task.emoji || "1f0cf.png", vectors.emojiVector.x-3.5, vectors.emojiVector.y-3.5, 7, 7);
        emojiBBox = self.emoji.getBBox();
        self.emoji.attr({transform: "rotate("+(-TaskDonut.angle_offset) + " " + emojiBBox.cx +" "+emojiBBox.cy+")"});
        TaskDonut.donut_group.add(self.emoji);
      }

      self.borderSlice.attr({stroke:"transparent", "stroke-width": 0, "fill": self.task.color || PiUtilities.colors.pieOrangeCream, 'd': borderSlice});
      self.mainSlice.attr({'d': slice, stroke:"white", 'fill-opacity': 1, "stroke-width": 0, "fill": "#FFFFFF"});

      self.terminalHandle.attr({"d": terminalHandleSlice, "fill":"transparent", "opacity": 0.4});
      self.startingHandle.attr({"d": startingHandleSlice, "fill":"transparent", "opacity": 0.4});

      self.innerStartingVectorLine. attr({
        stroke:"#cccccc", "stroke-width": .1,
        x1: TaskDonut.centerX, y1: TaskDonut.centerY,
        x2: vectors.innerStartingVector.x, y2: vectors.innerStartingVector.y
      });

      self.innerTerminalVectorLine.attr({
        stroke:"#cccccc", "stroke-width": .1,
        x1: TaskDonut.centerX, y1: TaskDonut.centerY,
        x2: vectors.innerTerminalVector.x, y2: vectors.innerTerminalVector.y
      });

      //apply special types
      if(self.task.type && self.task.type == "break"){
        self.innerStartingVectorLine.attr({"stroke-width": 0});
        self.innerTerminalVectorLine.attr({"stroke-width": 0});
        self.borderSlice.attr({"fill": "#7e3c46", 'stroke-width': 0, 'fill-opacity': .8});
        self.mainSlice.attr({"fill": "#7e3c46", 'stroke-width': 0, 'fill-opacity': .8});
      }

      if(self.task.type && self.task.type == "sleep"){
        self.innerStartingVectorLine.attr({"stroke-width": 0});
        self.innerTerminalVectorLine.attr({"stroke-width": 0});
        self.borderSlice.attr({"fill": sleepGradient, "fill-opacity": 1, 'stroke-width': 0});
        self.mainSlice.attr({"fill": sleepGradient, "fill-opacity": 1, 'stroke-width': 0});
      }


    }, speed, function(){

      self.startingAngle = newStartAngle;
      self.terminalAngle = newEndAngle;

      sliceAlreadyAnimating = false;

      if(callback)
        callback();

    });

  };

  //constructor
  init(_sliceIndex);

}