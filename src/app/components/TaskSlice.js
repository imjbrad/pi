export function findRelativeMousePoints(mx, my, TaskDonut){
  //translate the mouse coordinates to the svg viewbox coordinates
  var root = TaskDonut.svgNode[0];

  var mousePoint = root.createSVGPoint();
  mousePoint.x = mx;
  mousePoint.y = my;

  return mousePoint.matrixTransform(root.getScreenCTM().inverse());
}

export function TaskSlice(TaskDonut, segmentIndex) {

  //private
  var self = this;
  var resizeTaskSliceByDraggingHandle;
  var dragTaskSliceByEmoji;
  var stopDraggingTaskSliceByEmoji;
  var cancelledTaskSliceDropInBucket;
  var successfulTaskDropInBucket;
  var init;
  var HANDLE_SLICE_SIZE = 10;
  var ghost_circle;
  var ghost_emoji;
  var ghost_emoji_width = 7;
  var ghost_group;
  var dropCanceled;

  var patternImg = TaskDonut.drawingArea.image("app/assets/dark-stripes.png", 0, 0, 25, 25).attr({opacity:.15});
  var pattern = patternImg.toPattern(0, 0, 25, 25);

  var sleepGradient = TaskDonut.drawingArea.gradient("l(0, 0, 1, 0)#F8B978-#5C6879");

  //exposed
  self.sliceIndex = segmentIndex;

  self.slice = TaskDonut.drawingArea.path();
  self.innerSlice = TaskDonut.drawingArea.path();

  self.innerStartingVectorLine = TaskDonut.drawingArea.line();
  self.innerTerminalVectorLine = TaskDonut.drawingArea.line();

  self.tempData = {};

  TaskDonut.donut_group.add(self.slice, self.innerSlice, self.innerStartingVectorLine, self.innerTerminalVectorLine);

  init = function(){

    self.task = TaskDonut.tasks[self.sliceIndex];
    self.localAngle = self.task.angleSize;

    self.drawingAngles = self.calculateDrawingAngles(self.task.angleSize);
    self.startingAngle = self.drawingAngles["startingAngle"];
    self.terminalAngle = self.drawingAngles["terminalAngle"];

    self.innerSliceRadius = TaskDonut.radius/1.017;
    self.emojiRadius =  self.innerSliceRadius/1.1;

    var startingVector = [
      TaskDonut.centerX,
      TaskDonut.centerY,
      (TaskDonut.centerX+TaskDonut.radius*Math.cos(self.startingAngle)),
      (TaskDonut.centerY+TaskDonut.radius*Math.sin(self.startingAngle))
    ];

    var terminalVector = [
      TaskDonut.centerX,
      TaskDonut.centerY,
      (TaskDonut.centerX+TaskDonut.radius*Math.cos(self.terminalAngle)),
      (TaskDonut.centerY+TaskDonut.radius*Math.sin(self.terminalAngle))
    ];

    var innerStartingVector = [
      TaskDonut.centerX,
      TaskDonut.centerY,
      (TaskDonut.centerX+self.innerSliceRadius*Math.cos(self.startingAngle)),
      (TaskDonut.centerY+self.innerSliceRadius*Math.sin(self.startingAngle))
    ];

    var innerTerminalVector = [
      TaskDonut.centerX,
      TaskDonut.centerY,
      (TaskDonut.centerX+self.innerSliceRadius*Math.cos(self.terminalAngle)),
      (TaskDonut.centerY+self.innerSliceRadius*Math.sin(self.terminalAngle))
    ];

    var handleStartingVector = [
      TaskDonut.centerX,
      TaskDonut.centerY,
      (TaskDonut.centerX+TaskDonut.radius*Math.cos(self.terminalAngle - Snap.rad(HANDLE_SLICE_SIZE/2))),
      (TaskDonut.centerY+TaskDonut.radius*Math.sin(self.terminalAngle - Snap.rad(HANDLE_SLICE_SIZE/2)))
    ];

    var handleTerminalVector = [
      TaskDonut.centerX,
      TaskDonut.centerY,
      (TaskDonut.centerX+TaskDonut.radius*Math.cos(self.terminalAngle + Snap.rad(HANDLE_SLICE_SIZE/2))),
      (TaskDonut.centerY+TaskDonut.radius*Math.sin(self.terminalAngle + Snap.rad(HANDLE_SLICE_SIZE/2)))
    ];

    var emojiVector = [
      TaskDonut.centerX,
      TaskDonut.centerY,
      (TaskDonut.centerX+self.emojiRadius*Math.cos(self.startingAngle + Snap.rad(self.localAngle/2))),
      (TaskDonut.centerY+self.emojiRadius*Math.sin(self.startingAngle + Snap.rad(self.localAngle/2)))
    ];

    self.innerStartingVector = innerStartingVector;
    self.innerTerminalVector = innerTerminalVector;
    self.startingVector = startingVector;
    self.terminalVector = terminalVector;
    self.emojiVector = emojiVector;

    self.handleStartingVector = handleStartingVector;
    self.handleTerminalVector = handleTerminalVector;

  };

  self.calculateDrawingAngles = function(localAngle){
    var currentPosition = 0;

    TaskDonut.tasks.forEach(function(task, index, array){
      if(index<segmentIndex){
        currentPosition += task.angleSize;
      }
    });

    var startingAngle = Snap.rad(currentPosition);
    var terminalAngle = Snap.rad(currentPosition + localAngle);

    return {"startingAngle":startingAngle, "terminalAngle": terminalAngle};
  };

  self.willCauseOverlap = function() {

    var BUMPER = 2;
    self._willCauseOverlap = false;

    var total = 0;

    TaskDonut.slices.forEach(function(slice, index, array){
      total += slice.tempData.localAngle || slice.localAngle;
      if(index <= self.sliceIndex){
        var tempTerminalAngle = slice.tempData.terminalAngle || slice.terminalAngle;
        if(tempTerminalAngle < slice.startingAngle + Snap.rad(BUMPER)){
          self._willCauseOverlap = true;
          return false;
        }
      }
    });

    if(total >= 360){
      self._willCauseOverlap = true;
    }

    TaskDonut.total = total;

    return self._willCauseOverlap;
  };

  self.redraw = function(){
    init();
    self.draw();
  };

  self.redrawHandle = function(){
    self.drawHandle();
  };

  var emoji;
  self.draw = function() {

    var sweep = (self.terminalAngle.mod(2*Math.PI) - self.startingAngle.mod(2*Math.PI) > Math.PI) ? 1 : 0;

    //category slice
    var move = "M"+self.innerStartingVector[2]+","+self.innerStartingVector[3];
    var arc = "A"+self.innerSliceRadius+","+self.innerSliceRadius+" 0 "+sweep+" 1 "+self.innerTerminalVector[2]+","+self.innerTerminalVector[3];
    var lineTo = "L"+self.terminalVector[2]+","+self.terminalVector[3];
    var outerArc = "A"+TaskDonut.radius+","+TaskDonut.radius+" 0 "+sweep+" 0 "+self.startingVector[2]+","+self.startingVector[3];
    var close = "L"+self.innerStartingVector[2]+","+self.innerStartingVector[3]+" z";
    var categorySlice = [move, arc, lineTo, outerArc, close].join(" ");
    var fill = self.task.color;

    //emoji slice
    var innerMoveTo = "M"+TaskDonut.centerX+","+TaskDonut.centerY;
    var innerLineTo = "L"+self.innerStartingVector[2]+","+self.innerStartingVector[3];
    var innerArc = "A"+self.innerSliceRadius+","+self.innerSliceRadius+" 0 "+sweep+" 1 "+self.innerTerminalVector[2]+","+self.innerTerminalVector[3]+" z";
    var emojiSlice = [innerMoveTo, innerLineTo, innerArc].join(" ");

    //emoji image
    self.emoji_uri = self.task.emoji;

    if(self.emoji){
      self.emoji.remove();
    }

    if(self.emoji_uri){
      var emojiWidth = 7,
        emojiHeight = emojiWidth;
      var emojiX = self.emojiVector[2] - (emojiWidth/2);
      var emojiY = self.emojiVector[3] - (emojiWidth/2);
      var emojiCenterX = emojiX + (emojiWidth/2);
      var emojiCenterY = emojiY + (emojiHeight/2);

      self.emoji = TaskDonut.drawingArea.image("app/assets/emojis/72x72/"+self.emoji_uri+".png", emojiX, emojiY, emojiWidth, emojiHeight);
      self.emoji.attr({transform: "rotate("+(-TaskDonut.angle_offset) + " " + emojiCenterX +" "+ emojiCenterY +")"});
      TaskDonut.donut_group.add(self.emoji);

      self.emoji.drag(dragTaskSliceByEmoji, null, stopDraggingTaskSliceByEmoji);
    }

    //apply attributes
    self.innerStartingVectorLine.attr({x1: TaskDonut.centerX, y1: TaskDonut.centerY, x2: self.innerStartingVector[2], y2: self.innerStartingVector[3], stroke:"#ededed", "stroke-width":.25});
    self.innerTerminalVectorLine.attr({x1: TaskDonut.centerX, y1: TaskDonut.centerY, x2: self.innerTerminalVector[2], y2: self.innerTerminalVector[3], stroke:"#ededed", "stroke-width":.25});
    self.slice.attr({"d": categorySlice, stroke:"transparent", "stroke-width":.25, "fill":fill});
    self.innerSlice.attr({"d": emojiSlice, stroke:"white", "stroke-width":.25, "fill": "white"});

    //apply special types
    if(self.task.taskType && self.task.taskType == "standardBreak"){
      self.slice.attr({"fill": pattern, 'stroke-width': 0});
      self.innerSlice.attr({"fill": "transparent", 'stroke-width': 0});
    }

    if(self.task.taskType && self.task.taskType == "standardSleep"){
      self.innerStartingVectorLine.attr({"stroke-width": 0});
      self.innerTerminalVectorLine.attr({"stroke-width": 0});
      self.slice.attr({"fill": sleepGradient, opacity: 1, 'stroke-width': 0});
      self.innerSlice.attr({"fill": sleepGradient, opacity: .067, 'stroke-width': 0});
    }

  };


  self.drawHandle = function(){

    if(self.handle){
      self.handle.remove();
    }

    self.handle = TaskDonut.drawingArea.path();

    //handle slice
    var handleMoveTo = "M"+TaskDonut.centerX+","+TaskDonut.centerY;
    var handleLineTo = "L"+self.handleStartingVector[2]+","+self.handleStartingVector[3];
    var handleArc = "A"+TaskDonut.radius+","+TaskDonut.radius+" 0 0 1 "+self.handleTerminalVector[2]+","+self.handleTerminalVector[3]+" z";
    var handleSlice = [handleMoveTo, handleLineTo, handleArc].join(" ");

    self.handle.attr({"d": handleSlice, "fill":"transparent", "opacity": 0.4});

    self.handle.drag(resizeTaskSliceByDraggingHandle);
    TaskDonut.donut_group.add(self.handle);

  };

  /*
  * sets temporary data.
  * when the donut tries to
  * redistribute, it redistributes
  * with with any available temp
  * data. if the donut is still
  * valid w/ the temp data, the temp
  * data becomes permanent
  * */

  self.update = function(tempData){

    for(var key in self.tempData){
      if(key in tempData){
        var value = tempData[key];
        self.tempData[key] = value;
      }
    }

    TaskDonut.redistributeTasks();

  };

  dragTaskSliceByEmoji = function(dx, dy, mx, my){
    TaskDonut.bucket_ring.show();

    dropCanceled = false;
    var relativeMouse = findRelativeMousePoints(mx, my, TaskDonut, self.slice);

    //hide the slice
    var animationAttributes = {opacity: 0};
    self.innerSlice.attr(animationAttributes);
    self.slice.attr(animationAttributes);
    self.emoji.attr(animationAttributes);

    //turn the task into a circle
    var cx = relativeMouse.x + 3,
      cy = relativeMouse.y - 3,
      r = 8;

    var path = "M "+cx+" "+cy+" m "+(-r)+", 0 a "+r+","+r+" 0 1,0 "+(r * 2)+",0 a "+r+","+r+" 0 1,0"+(-r * 2)+",0";

    if(!ghost_group){
      ghost_circle = TaskDonut.drawingArea.path();
      var ghost_emoji_box = self.emoji.getBBox();
      ghost_emoji = TaskDonut.drawingArea.image("app/assets/emojis/72x72/"+self.emoji_uri+".png", ghost_emoji_box.x, ghost_emoji_box.y, ghost_emoji_box.w, ghost_emoji_box.h);

      ghost_group = TaskDonut.drawingArea.group();
      ghost_group.add(ghost_circle, ghost_emoji);
    }

    ghost_emoji.attr({"x": cx-(ghost_emoji_width/2), "y": cy-(ghost_emoji_width/2), "width": ghost_emoji_width, "height": ghost_emoji_width}) ;
    ghost_circle.attr({"d": path, stroke: self.task.color, "stroke-width": 1, "fill":"white"});

    //broadcast that the task is dragging
    eve("taskSliceIsDragging", {}, self, relativeMouse.x, relativeMouse.y);

  };

  stopDraggingTaskSliceByEmoji = function(e){
    TaskDonut.bucket_ring.hide();

    var relativeMouse = findRelativeMousePoints(e.x, e.y, TaskDonut, self.slice);
    eve("taskSliceStoppedDragging", {}, self, relativeMouse.x, relativeMouse.y);
  };

  successfulTaskDropInBucket = function(){
    if(ghost_group){
      dropCanceled = false;
      ghost_group.remove();
      ghost_group = null;
    }
  };

  cancelledTaskSliceDropInBucket = function(){
    if(!dropCanceled){

      if(ghost_group){
        ghost_group.remove();
        ghost_group = null;

        //reshow the slice
        var animationAttributes = {opacity: 1};
        self.innerSlice.attr(animationAttributes);
        self.slice.attr(animationAttributes);
        self.emoji.attr(animationAttributes);

        dropCanceled = true;

      }

    }
  };

  resizeTaskSliceByDraggingHandle = function(dx, dy, mx, my){

    //translate the mouse coordinates to the svg viewbox coordinates
    var root = TaskDonut.svgNode[0];

    var mousePoint = root.createSVGPoint();
    mousePoint.x = mx;
    mousePoint.y = my;

    var ctm = self.handle.node.getScreenCTM();

    if (ctm = ctm.inverse()){
      var relativeMousePoint = mousePoint.matrixTransform(ctm);
    }

    var relative_mx = relativeMousePoint.x;
    var relative_my = relativeMousePoint.y;

    var relative_center_x = TaskDonut.centerX;
    var relative_center_y = TaskDonut.centerY;

    var mouseAngle = Math.atan2(relative_my - relative_center_y, relative_mx - relative_center_x).mod(2*Math.PI);

    var newLocalTheta = (Snap.deg((mouseAngle - self.terminalAngle)) + self.localAngle);

    self.update({
      localAngle: newLocalTheta,
      terminalAngle: self.calculateDrawingAngles(newLocalTheta).terminalAngle
    });

    TaskDonut.dispatch("userUpdatedDonutManually", [self.tasks]);

  };

  /*
   * Eve
   * */
  eve.on("cancelledTaskSliceDropInBucket"+self.sliceIndex, cancelledTaskSliceDropInBucket);
  eve.on("successfulTaskDropInBucket"+self.sliceIndex, successfulTaskDropInBucket);

  init();

}
