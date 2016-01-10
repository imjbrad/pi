import { PieUtilities } from './TaskDonutUtilities.js';

//translate the mouse coordinates to the svg viewbox coordinates
function findRelativeMousePoints(mx, my, TaskDonut){
  var root = TaskDonut.svgNode[0];
  var mousePoint = root.createSVGPoint();
  mousePoint.x = mx;
  mousePoint.y = my;
  return mousePoint.matrixTransform(TaskDonut.p.node.getScreenCTM().inverse());
}

function findRelativeMouseAngle(x, y, TaskDonut){
  var relative_mx = x;
  var relative_my = y;
  var relative_center_x = TaskDonut.centerX;
  var relative_center_y = TaskDonut.centerY;
  var mouseAngle = Math.atan2(relative_my - relative_center_y, relative_mx - relative_center_x).mod(Math.TWOPI);
  return Math.round(Snap.deg(mouseAngle));
}

function makeSliceString(outerStartX, outerStartY, outerRadius, outerEndX, outerEndY, innerStartX, innerStartY, innerRadius, innerEndX, innerEndY, _sweep){

  var sweep = _sweep,
      move = "M"+innerStartX+","+innerStartY,
      arc = "A"+innerRadius+","+innerRadius+" 0 "+sweep+" 1 "+innerEndX+","+innerEndY,
      lineTo = "L"+outerEndX+","+outerEndY,
      outerArc = "A"+outerRadius+","+outerRadius+" 0 "+sweep+" 0 "+outerStartX+","+outerStartY,
      close = "L"+innerStartX+","+innerStartY+" z";

  return [move, arc, lineTo, outerArc, close].join(" ");
}

export function TaskSlice(TaskDonut, segmentIndex, task) {

  //private
  var self = this;
  var _resizeTaskSliceByDraggingHandle;
  var resizeTaskSliceByDraggingStartingHandle;
  var resizeTaskSliceByDraggingTerminalHandle;
  var HANDLE_SLICE_SIZE = 3;
  var taskManager = TaskDonut.taskManager;
  var task  = task;
  var lock;
  var patternImg = TaskDonut.drawingArea.image("http://www.transparenttextures.com/patterns/debut-light.png", 0, 0, 100, 100).attr({"opacity": 1});
  var pattern = patternImg.toPattern(0, 0, 100, 100);
  var sleepGradient = TaskDonut.drawingArea.gradient("l(0, 0, 1, 0)#F8B978-#5C6879");

  self.borderSlice = TaskDonut.drawingArea.path();
  self.mainSlice = TaskDonut.drawingArea.path();
  self.tempSlice = TaskDonut.drawingArea.path();
  self.terminalHandle = TaskDonut.drawingArea.path();
  self.startingHandle = TaskDonut.drawingArea.path();
  self.innerStartingVectorLine = TaskDonut.drawingArea.line();
  self.innerTerminalVectorLine = TaskDonut.drawingArea.line();
  self.tempData = {};

  TaskDonut.donut_group.add(self.borderSlice, self.mainSlice,  self.tempSlice, self.innerStartingVectorLine, self.innerTerminalVectorLine);

  function _construct(task){

    _linkTask();
    _calculateSizeAndVectors(task);
    _attachDragHandlers();

    self.draw();

  }

  function _linkTask(task){
    self.taskIndex = self.taskIndex || segmentIndex;
    self.task = taskManager.getTask(self.taskIndex);
  }
  
  function _calculateSizeAndVectors(_task){
    self.startingAngle = Snap.rad(PieUtilities.toAngle(_task.start)).mod(Math.TWOPI);
    self.terminalAngle = Snap.rad(PieUtilities.toAngle(_task.end)).mod(Math.TWOPI);
    console.log("slice drawing end at "+PieUtilities.toAngle(_task.end));
    self.mainSliceRadius = TaskDonut.sliceBorderRadius;
    self.emojiRadius =  self.mainSliceRadius/1.1;
    self.startingVector = TaskDonut.toXY(self.startingAngle, TaskDonut.radius);
    self.terminalVector = TaskDonut.toXY(self.terminalAngle, TaskDonut.radius);
    self.innerStartingVector = TaskDonut.toXY(self.startingAngle, self.mainSliceRadius);
    self.innerTerminalVector = TaskDonut.toXY(self.terminalAngle, self.mainSliceRadius);
    self.startingHandleStartingVector = TaskDonut.toXY(self.startingAngle + Snap.rad(HANDLE_SLICE_SIZE), TaskDonut.radius);
    self.startingHandleTerminalVector = TaskDonut.toXY(self.startingAngle, TaskDonut.radius);
    self.terminalHandleStartingVector = TaskDonut.toXY(self.terminalAngle - Snap.rad(HANDLE_SLICE_SIZE), TaskDonut.radius);
    self.terminalHandleTerminalVector = TaskDonut.toXY(self.terminalAngle, TaskDonut.radius);
    self.emojiVector = TaskDonut.toXY(self.startingAngle + Snap.rad(self.angleSize/2), self.emojiRadius);
  }

  self.redraw = function(){
    _linkTask();
    _calculateSizeAndVectors(self.task);
    self.draw();
  };

  self.redrawHandle = function(){
    self.drawHandle();
  };

  self.draw = function() {

    var sweep = (self.terminalAngle - self.startingAngle > Math.PI) ? 1 : 0;

    //main slice
    var innerMoveTo = "M"+TaskDonut.centerX+","+TaskDonut.centerY;
    var innerLineTo = "L"+self.innerStartingVector.x+","+self.innerStartingVector.y;
    var innerArc = "A"+self.mainSliceRadius+","+self.mainSliceRadius+" 0 "+sweep+" 1 "+self.innerTerminalVector.x+","+self.innerTerminalVector.y+" z";
    var mainSlice = [innerMoveTo, innerLineTo, innerArc].join(" ");

    //border slice
    var borderSlice = makeSliceString(
        self.startingVector.x, self.startingVector.y,
        TaskDonut.radius, self.terminalVector.x,
        self.terminalVector.y, self.innerStartingVector.x,
        self.innerStartingVector.y, self.mainSliceRadius,
        self.innerTerminalVector.x, self.innerTerminalVector.y, sweep
    );

    //emoji image
    self.emoji_uri = self.task.emoji;
    if(self.emoji){
      self.emoji.remove();
    }

    if(self.emoji_uri){

      var emojiWidth = 7,
        emojiHeight = emojiWidth,
        emojiX = self.emojiVector.x - (emojiWidth/2),
        emojiY = self.emojiVector.y - (emojiWidth/2),
        emojiCenterX = emojiX + (emojiWidth/2),
        emojiCenterY = emojiY + (emojiHeight/2);

      self.emoji = TaskDonut.drawingArea.image("app/assets/emojis/72x72/"+self.emoji_uri+".png", emojiX, emojiY, emojiWidth, emojiHeight);
      self.emoji.attr({transform: "rotate("+(-TaskDonut.angle_offset) + " " + emojiCenterX +" "+ emojiCenterY +")"});
      self.emoji.drag(dragTaskSliceByEmoji, null, stopDraggingTaskSliceByEmoji);

      TaskDonut.donut_group.add(self.emoji);
    }

    //apply attributes
    self.innerStartingVectorLine. attr({x1: TaskDonut.centerX, y1: TaskDonut.centerY, x2: self.innerStartingVector.x, y2: self.innerStartingVector.y, stroke:"#cccccc", "stroke-width": .1});
    self.innerTerminalVectorLine.attr({x1: TaskDonut.centerX, y1: TaskDonut.centerY, x2: self.innerTerminalVector.x, y2: self.innerTerminalVector.y, stroke:"#cccccc", "stroke-width": .1});
    self.borderSlice.attr({"d": borderSlice, stroke:"transparent", "stroke-width": 0, "fill": PieUtilities.colors.pieOrangeCream});
    self.mainSlice.attr({"d": mainSlice, stroke:"white", "stroke-width": 0, "fill": "#FFFFFF"});

    //apply special types
    if(self.task.type && self.task.type == "break"){
      self.innerStartingVectorLine.attr({"stroke-width": 0});
      self.innerTerminalVectorLine.attr({"stroke-width": 0});
      self.borderSlice.attr({"fill": "#ffffff", 'stroke-width': 0, 'fill-opacity': .54});
      self.mainSlice.attr({"fill": "#ffffff", 'stroke-width': 0, 'fill-opacity': .54});
    }

    if(self.task.type && self.task.type == "sleep"){
      self.innerStartingVectorLine.attr({"stroke-width": 0});
      self.innerTerminalVectorLine.attr({"stroke-width": 0});
      self.borderSlice.attr({"fill": sleepGradient, opacity: .85, 'stroke-width': 0});
      self.mainSlice.attr({"fill": sleepGradient, opacity: .75, 'stroke-width': 0});
    }
  };


  self.drawHandle = function(){

    //starting handle slice
    var startingHandleMoveTo = "M"+TaskDonut.centerX+","+TaskDonut.centerY;
    var startingHandleLineTo = "L"+self.startingHandleStartingVector.x+","+self.startingHandleStartingVector.y;
    var startingHandleArc = "A"+TaskDonut.radius+","+TaskDonut.radius+" 0 0 1 "+self.startingHandleTerminalVector.x+","+self.startingHandleTerminalVector.y+" z";
    var startingHandleSlice = [startingHandleMoveTo, startingHandleLineTo, startingHandleArc].join(" ");

    //terminal handle slice
    var terminalHandleMoveTo = "M"+TaskDonut.centerX+","+TaskDonut.centerY;
    var terminalHandleLineTo = "L"+self.terminalHandleStartingVector.x+","+self.terminalHandleStartingVector.y;
    var terminalHandleArc = "A"+TaskDonut.radius+","+TaskDonut.radius+" 0 0 1 "+self.terminalHandleTerminalVector.x+","+self.terminalHandleTerminalVector.y+" z";
    var terminalHandleSlice = [terminalHandleMoveTo, terminalHandleLineTo, terminalHandleArc].join(" ");

    self.terminalHandle.attr({"d": terminalHandleSlice, "fill":"transparent", "opacity": 0.4});
    self.startingHandle.attr({"d": startingHandleSlice, "fill":"transparent", "opacity": 0.4});

    //self.terminalHandle.dblclick(resizeTaskJointByDoubleClickingAndDragging);
    TaskDonut.donut_group.add(self.startingHandle, self.terminalHandle);
  };

  resizeTaskSliceByDraggingStartingHandle = function(){
    _resizeTaskSliceByDraggingHandle.apply("start-handle", arguments);
  };

  resizeTaskSliceByDraggingTerminalHandle = function(){
    _resizeTaskSliceByDraggingHandle.apply("end-handle", arguments);
  };

  self.startingHandle.drag(resizeTaskSliceByDraggingStartingHandle);
  self.terminalHandle.drag(resizeTaskSliceByDraggingTerminalHandle);

  var resizeTaskJointByDoubleClickingAndDragging;
  var jointResizeMode,
      jointResizeTimeout;

  function _cancelJointResizeMode(){
    jointResizeMode = false;
    _cancelJointResizeTimeout();
    _attachDragHandlers();
    console.log("canceled joint mode");
  }

  function _cancelJointResizeTimeout(){
    window.clearTimeout(jointResizeTimeout);
  }

  function _setJointResizeTimeout(){
    _clearDefaultDragHandlers();
    //jointResizeTimeout = window.setTimeout(() => {_cancelJointResizeMode()}, 500);
  }

  function _clearDefaultDragHandlers(){
    self.terminalHandle.undrag();
    self.startingHandle.undrag();
  }

  function _attachDragHandlers(){
    self.startingHandle.drag(resizeTaskSliceByDraggingStartingHandle);
    self.terminalHandle.drag(resizeTaskSliceByDraggingTerminalHandle);
  }

  function _resetJointResizeTimeout(){
    _cancelJointResizeMode();
    _setJointResizeTimeout();
  }

  resizeTaskJointByDoubleClickingAndDragging = function(){

    var nextTask = taskManager.getTask(task.id + 1),
        nextTaskStart = nextTask.start;

    if(nextTask && (moment(nextTaskStart).isSame(task.end))) {
      jointResizeMode = "initiated";
      console.log("joint mode enabled");
      _clearDefaultDragHandlers();

      self.terminalHandle.drag(
          function drag(dx, dy, mx, my) {
            jointResizeMode = "dragging";
            console.log("dragging in resize joint mode");

            var mp = findRelativeMousePoints(mx, my, TaskDonut);
            var mouseAngle = findRelativeMouseAngle(mp.x, mp.y, TaskDonut);

            task.end = PieUtilities.toTimeOfDay(mouseAngle);
            nextTask.start = task.end;

            taskManager.updateTasks("all");
          },

          function startDrag() {
            _cancelJointResizeTimeout();
          },

          function endDrag() {
            _cancelJointResizeMode();
          });
    }

  };

  function lockSlice(){
    console.log("locking interface");
    lock = true;
  }

  function unlockSlice(){
    console.log("unlocking interface");
    lock = false;
  }

  _resizeTaskSliceByDraggingHandle = function(dx, dy, mx, my){

    //this = terminal mode or starting mode
    var handleKey = this;
    var handleKey = handleKey.split("-")[0];
    var taskIDs = [self.taskIndex];
    var relativeMousePoint = findRelativeMousePoints(mx, my, TaskDonut);
    var liveAngle = findRelativeMouseAngle(relativeMousePoint.x, relativeMousePoint.y, TaskDonut);
    var liveTime = PieUtilities.toTimeOfDay(liveAngle);

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
    TaskDonut.taskManager.updateTasks(taskIDs, handleKey+"-ripple");

  };


  //constructor
  _construct(task);

}
