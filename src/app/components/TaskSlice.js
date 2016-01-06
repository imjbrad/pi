import { PieUtilities } from './TaskDonutUtilities.js';

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
  var _resizeTaskSliceByDraggingHandle;
  var resizeTaskSliceByDraggingStartingHandle;
  var resizeTaskSliceByDraggingTerminalHandle;
  var dragTaskSliceByEmoji;
  var stopDraggingTaskSliceByEmoji;
  var cancelledTaskSliceDropInBucket;
  var successfulTaskDropInBucket;
  var showTimeWhileResizing;
  var hideTimeWhenNotResizing;
  var init;
  var HANDLE_SLICE_SIZE = 5;
  var ghost_circle;
  var ghost_emoji;
  var ghost_emoji_width = 7;
  var ghost_group;
  var dropCanceled;
  var timeGroup = TaskDonut.drawingArea.g();

  var patternImg = TaskDonut.drawingArea.image("http://www.transparenttextures.com/patterns/debut-light.png", 0, 0, 100, 100).attr({"opacity": 1});
  var pattern = patternImg.toPattern(0, 0, 100, 100);

  var sleepGradient = TaskDonut.drawingArea.gradient("l(0, 0, 1, 0)#F8B978-#5C6879");

  //exposed
  self.slice = TaskDonut.drawingArea.path();
  self.innerSlice = TaskDonut.drawingArea.path();
  self.tempSlice = TaskDonut.drawingArea.path();

  self.innerStartingVectorLine = TaskDonut.drawingArea.line();
  self.innerTerminalVectorLine = TaskDonut.drawingArea.line();

  self.time = TaskDonut.drawingArea.text();
  self.sun = TaskDonut.drawingArea.circle();

  timeGroup.add(self.time, self.sun);
  timeGroup.attr({opacity: 0});

  self.tempData = {};

  TaskDonut.donut_group.add(self.slice, self.innerSlice,  self.tempSlice, self.innerStartingVectorLine, self.innerTerminalVectorLine);

  init = function(){

    self.sliceIndex = self.sliceIndex || segmentIndex;

    self.task = TaskDonut.tasks[self.sliceIndex];

    self.drawingAngles = self.calculateDrawingAngles();
    self.startingAngle = self.task.startingAngle.mod(Math.TWOPI);
    self.terminalAngle = self.task.terminalAngle.mod(Math.TWOPI);

    console.log(PieUtilities.toTimeOfDay(Snap.deg(self.startingAngle), true));
    console.log(PieUtilities.toTimeOfDay(Snap.deg(self.terminalAngle), true));

    self.innerSliceRadius = TaskDonut.sliceBorderRadius;
    self.emojiRadius =  self.innerSliceRadius/1.1;

    self.timeRadius = TaskDonut.outerRadius + 8;

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

    var startingHandleStartingVector = [
      TaskDonut.centerX,
      TaskDonut.centerY,
      (TaskDonut.centerX+TaskDonut.radius*Math.cos(self.startingAngle + Snap.rad(HANDLE_SLICE_SIZE))),
      (TaskDonut.centerY+TaskDonut.radius*Math.sin(self.startingAngle + Snap.rad(HANDLE_SLICE_SIZE)))
    ];

    var startingHandleTerminalVector = [
      TaskDonut.centerX,
      TaskDonut.centerY,
      (TaskDonut.centerX+TaskDonut.radius*Math.cos(self.startingAngle)),
      (TaskDonut.centerY+TaskDonut.radius*Math.sin(self.startingAngle))
    ];

    var terminalHandleStartingVector = [
      TaskDonut.centerX,
      TaskDonut.centerY,
      (TaskDonut.centerX+TaskDonut.radius*Math.cos(self.terminalAngle - Snap.rad(HANDLE_SLICE_SIZE))),
      (TaskDonut.centerY+TaskDonut.radius*Math.sin(self.terminalAngle - Snap.rad(HANDLE_SLICE_SIZE)))
    ];

    var terminalHandleTerminalVector = [
      TaskDonut.centerX,
      TaskDonut.centerY,
      (TaskDonut.centerX+TaskDonut.radius*Math.cos(self.terminalAngle)),
      (TaskDonut.centerY+TaskDonut.radius*Math.sin(self.terminalAngle))
    ];

    var emojiVector = [
      TaskDonut.centerX,
      TaskDonut.centerY,
      (TaskDonut.centerX+self.emojiRadius*Math.cos(self.startingAngle + Snap.rad(self.angleSize/2))),
      (TaskDonut.centerY+self.emojiRadius*Math.sin(self.startingAngle + Snap.rad(self.angleSize/2)))
    ];

    var timeVector = [
      TaskDonut.centerX,
      TaskDonut.centerY,
      TaskDonut.centerX+self.timeRadius*Math.cos(self.terminalAngle),
      TaskDonut.centerY+self.timeRadius*Math.sin(self.terminalAngle)
    ];

    self.innerStartingVector = innerStartingVector;
    self.innerTerminalVector = innerTerminalVector;
    self.startingVector = startingVector;
    self.terminalVector = terminalVector;
    self.emojiVector = emojiVector;
    self.timeVector = timeVector;

    self.terminalHandleStartingVector = terminalHandleStartingVector;
    self.terminalHandleTerminalVector = terminalHandleTerminalVector;
    self.startingHandleTerminalVector = startingHandleTerminalVector;
    self.startingHandleStartingVector = startingHandleStartingVector;

    timeGroup.attr({
      transform: "rotate("+(TaskDonut.angle_offset) + " " + TaskDonut.centerX +" "+ TaskDonut.centerY +")"
    });

  };

  self.calculateDrawingAngles = function(angleSize){
    var currentPosition = 0;

    TaskDonut.tasks.forEach(function(task, index, array){
      if(index<segmentIndex){
        currentPosition += task.angleSize;
      }
    });

    var startingAngle,
        terminalAngle;

    startingAngle = self.task.startingAngle ? Snap.rad(self.task.startingAngle) : Snap.rad(currentPosition);
    terminalAngle = self.task.terminalAngle ? Snap.rad(self.task.terminalAngle) : startingAngle + Snap.rad(angleSize).mod(2*Math.PI);

    return {"startingAngle":startingAngle, "terminalAngle": terminalAngle};
  };

  self.willCauseOverlap = function() {

    var BUMPER = 2;
    self._willCauseOverlap = false;

    var total = 0;

    var index = self.sliceIndex;
    var last = TaskDonut.slices.length - 1;

    var previousIndex = (index == 0) ? last : index - 1;
    var nextIndex = (index == last) ? 0 : index + 1;

    var slice = self;
    var previousSlice = TaskDonut.slices[previousIndex];
    var nextSlice = TaskDonut.slices[nextIndex];

    var nextTerminalAngle = nextSlice.tempData.terminalAngle || nextSlice.terminalAngle;
    var nextTerminalTime = PieUtilities.toTimeOfDay(Snap.deg(nextTerminalAngle));

    var nextStartingAngle = nextSlice.tempData.startingAngle || nextSlice.startingAngle;
    var nextStartingTime = PieUtilities.toTimeOfDay(Snap.deg(nextStartingAngle));

    var previousTerminalAngle = previousSlice.tempData.terminalAngle || previousSlice.terminalAngle;
    var previousTerminalTime = PieUtilities.toTimeOfDay(Snap.deg(previousTerminalAngle));

    var previousStartingAngle = previousSlice.tempData.startingAngle || previousSlice.startingAngle;
    var previousStartingTime = PieUtilities.toTimeOfDay(Snap.deg(previousStartingAngle));

    var startingAngle = slice.tempData.startingAngle || slice.startingAngle;
    var startingTime = PieUtilities.toTimeOfDay(Snap.deg(startingAngle));

    var terminalAngle = slice.tempData.terminalAngle || slice.terminalAngle;
    var terminalTime = PieUtilities.toTimeOfDay(Snap.deg(terminalAngle));

    var angleSize = terminalAngle - startingAngle;

    TaskDonut.total = total;

    if(terminalTime.isBefore(startingTime)){
        console.log("Task cannot end before it starts "+terminalTime.format(PieUtilities.FULL_FORMAT_STRING)+", "+startingTime.format(PieUtilities.FULL_FORMAT_STRING));
        return true;
    }

    if(index > 0 && startingTime.isBefore(previousTerminalTime)){
      console.log("Task can't collide with previous task "+startingTime.format(PieUtilities.FULL_FORMAT_STRING)+", "+previousTerminalTime.format(PieUtilities.FULL_FORMAT_STRING));
      return true;
    }

    if(index < last && nextStartingTime.isBefore(terminalTime)){
      console.log("Task can't collide with next task "+nextStartingTime.format(PieUtilities.FULL_FORMAT_STRING)+", "+terminalTime.format(PieUtilities.FULL_FORMAT_STRING));
      return true;
    }

    if(angleSize < Snap.rad(BUMPER)){
      console.log("Task can't be too small");
      return true;
    }

    return self._willCauseOverlap;

  };

  self.redraw = function(){
    self.relinkToTask();
    init();
    self.draw();
  };

  self.redrawHandle = function(){
    self.drawHandle();
  };

  self.relinkToTask = function(){
    self.sliceIndex = TaskDonut.tasks.indexOf(self.task);
  };


  var emoji;
  self.draw = function() {


    var sweep = (self.terminalAngle - self.startingAngle > Math.PI) ? 1 : 0;

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

      var colorThief = new ColorThief();

      var img = new Image(72, 72);
      img.src = "app/assets/emojis/72x72/"+self.emoji_uri+".png";

      var suggestedBackgroundColor = colorThief.getColor(img);
      suggestedBackgroundColor.push(1);
      suggestedBackgroundColor = "rgba("+suggestedBackgroundColor.join(",")+")";

    }

    //time
    var timeBox = self.time.getBBox();

    self.time.attr({
      x: self.timeVector[2],
      y: self.timeVector[3],
      //text: PieUtilities.toTimeOfDay(Snap.deg(self.terminalAngle), "h:mm A"),
      "alignment-baseline": "central",
      "font-size": 3.5,
      "fill": "black",
      transform: "rotate("+(-TaskDonut.angle_offset) + " " + self.timeVector[2] +" "+ self.timeVector[3] +")"
    });

    self.sun.attr({
      cx: self.timeVector[2],
      cy: self.timeVector[3],
      //r: 1.5,
      fill: PieUtilities.colorForAngle(Snap.deg(self.terminalAngle))
    });

    //apply attributes
    self.innerStartingVectorLine.attr({x1: TaskDonut.centerX, y1: TaskDonut.centerY, x2: self.innerStartingVector[2], y2: self.innerStartingVector[3], stroke:"#cccccc", "stroke-width": .1});
    self.innerTerminalVectorLine.attr({x1: TaskDonut.centerX, y1: TaskDonut.centerY, x2: self.innerTerminalVector[2], y2: self.innerTerminalVector[3], stroke:"#cccccc", "stroke-width": .1});
    self.slice.attr({"d": categorySlice, stroke:"transparent", "stroke-width": 0, "fill": PieUtilities.colors.pieOrangeCream});
    self.innerSlice.attr({"d": emojiSlice, stroke:"white", "stroke-width": 0, "fill": "#FFFFFF"});

    //apply special types
    if(self.task.type && self.task.type == "break"){
      self.innerStartingVectorLine.attr({"stroke-width": 0});
      self.innerTerminalVectorLine.attr({"stroke-width": 0});
      self.slice.attr({"fill": "#ffffff", 'stroke-width': 0, 'fill-opacity': .54});
      self.innerSlice.attr({"fill": "#ffffff", 'stroke-width': 0, 'fill-opacity': .54});
    }

    if(self.task.type && self.task.type == "sleep"){
      self.innerStartingVectorLine.attr({"stroke-width": 0});
      self.innerTerminalVectorLine.attr({"stroke-width": 0});
      self.slice.attr({"fill": sleepGradient, opacity: .85, 'stroke-width': 0});
      self.innerSlice.attr({"fill": sleepGradient, opacity: .75, 'stroke-width': 0});
    }

  };


  self.drawHandle = function(){

    if(self.terminalHandle || self.startingHandle){
      self.terminalHandle.remove();
      self.startingHandle.remove();
    }

    self.terminalHandle = TaskDonut.drawingArea.path();
    self.startingHandle = TaskDonut.drawingArea.path();

    //starting handle slice
    var startingHandleMoveTo = "M"+TaskDonut.centerX+","+TaskDonut.centerY;
    var startingHandleLineTo = "L"+self.startingHandleStartingVector[2]+","+self.startingHandleStartingVector[3];
    var startingHandleArc = "A"+TaskDonut.radius+","+TaskDonut.radius+" 0 0 1 "+self.startingHandleTerminalVector[2]+","+self.startingHandleTerminalVector[3]+" z";
    var startingHandleSlice = [startingHandleMoveTo, startingHandleLineTo, startingHandleArc].join(" ");

    //terminal handle slice
    var terminalHandleMoveTo = "M"+TaskDonut.centerX+","+TaskDonut.centerY;
    var terminalHandleLineTo = "L"+self.terminalHandleStartingVector[2]+","+self.terminalHandleStartingVector[3];
    var terminalHandleArc = "A"+TaskDonut.radius+","+TaskDonut.radius+" 0 0 1 "+self.terminalHandleTerminalVector[2]+","+self.terminalHandleTerminalVector[3]+" z";
    var terminalHandleSlice = [terminalHandleMoveTo, terminalHandleLineTo, terminalHandleArc].join(" ");

    self.terminalHandle.attr({"d": terminalHandleSlice, "fill":"transparent", "opacity": 0.4});
    self.startingHandle.attr({"d": startingHandleSlice, "fill":"transparent", "opacity": 0.4});

    self.startingHandle.drag(resizeTaskSliceByDraggingStartingHandle, null, hideTimeWhenNotResizing);
    self.terminalHandle.drag(resizeTaskSliceByDraggingTerminalHandle, null, hideTimeWhenNotResizing);

    TaskDonut.donut_group.add(self.startingHandle, self.terminalHandle);

  };

  /*
  * returns the bbox for a slice
  * constructed with whatever temp data
  * is available
  * */
   self.getTemporaryBBox = function(){
    
    var startingAngle = (Snap.rad(self.tempData.startingAngle) || self.startingAngle);
    var terminalAngle = (Snap.rad(self.tempData.terminalAngle) || self.terminalAngle);

    var sweep = (terminalAngle - startingAngle > Math.PI) ? 1 : 0;

    var startingVector = [
      (TaskDonut.centerX+self.innerSliceRadius*Math.cos(startingAngle)),
      (TaskDonut.centerY+self.innerSliceRadius*Math.sin(startingAngle))
    ];

    var terminalVector = [
      (TaskDonut.centerX+self.innerSliceRadius*Math.cos(terminalAngle)),
      (TaskDonut.centerY+self.innerSliceRadius*Math.sin(terminalAngle))
    ];

    var innerMoveTo = "M"+TaskDonut.centerX+","+TaskDonut.centerY;
    var innerLineTo = "L"+startingVector[0]+","+startingVector[1];
    var innerArc = "A"+self.innerSliceRadius+","+self.innerSliceRadius+" 0 "+sweep+" 1 "+terminalVector[0]+","+terminalVector[1]+" z";
    var slicePath = [innerMoveTo, innerLineTo, innerArc].join(" ");

    self.tempSlice.attr({"d": slicePath, opacity: 1});
    return slicePath;

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

    for(var key in tempData){
        var value = tempData[key];
        self.tempData[key] = value;
    }

   // TaskDonut.redistributeTasks();
    TaskDonut.redistributeTaskAtIndex(self.sliceIndex);

  };

  self._applyTempData = function(){
    for(var key in self.tempData){
        var value = self.tempData[key];
        self.task[key] = value;
    }
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

  showTimeWhileResizing = function(){
    timeGroup.attr({
      opacity: 1
    });
  };

  hideTimeWhenNotResizing = function(){
    timeGroup.attr({opacity: 0});
  };

  resizeTaskSliceByDraggingStartingHandle = function(){
    _resizeTaskSliceByDraggingHandle.apply("startingHandle", arguments);
  };

  resizeTaskSliceByDraggingTerminalHandle = function(){
    _resizeTaskSliceByDraggingHandle.apply("terminalHandle", arguments);
  };

  _resizeTaskSliceByDraggingHandle = function(dx, dy, mx, my){

    //this = terminal mode or starting mode
    var handleKey = this;

    //translate the mouse coordinates to the svg viewbox coordinates
    var root = TaskDonut.svgNode[0];

    var mousePoint = root.createSVGPoint();
    mousePoint.x = mx;
    mousePoint.y = my;

    var ctm = self[handleKey].node.getScreenCTM();

    if (ctm = ctm.inverse()){
      var relativeMousePoint = mousePoint.matrixTransform(ctm);
    }

    var relative_mx = relativeMousePoint.x;
    var relative_my = relativeMousePoint.y;

    var relative_center_x = TaskDonut.centerX;
    var relative_center_y = TaskDonut.centerY;

    var mouseAngle = Math.atan2(relative_my - relative_center_y, relative_mx - relative_center_x).mod(2*Math.PI);

    var fiveMinutes = PieUtilities.toAngleSize(1);

    //var newLocalTheta = (Snap.deg((mouseAngle - self.terminalAngle)) + self.angleSize);
    //var newLocalTheta = Math.ceil(newLocalTheta/fiveMinutes)*fiveMinutes;

    var newAttributes = {};

    if(handleKey == "startingHandle"){
      newAttributes['startingAngle'] = mouseAngle;
    }

    if(handleKey == "terminalHandle"){
      newAttributes['terminalAngle'] = mouseAngle;
    }

    self.update(newAttributes);

    showTimeWhileResizing();

    TaskDonut.dispatch("userUpdatedDonutManually", [self.tasks]);

  };

  /*
   * Eve
   * */
  eve.on("cancelledTaskSliceDropInBucket"+self.sliceIndex, cancelledTaskSliceDropInBucket);
  eve.on("successfulTaskDropInBucket"+self.sliceIndex, successfulTaskDropInBucket);

  init();

}
