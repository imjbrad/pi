/**
 * Created by jordanbradley on 12/1/15.
 */

export function Bucket(_taskDonut, _startingAngle, _angularSize) {

  //private
  var self = this,
    init,

    TaskDonut = _taskDonut,
    startingAngle = _startingAngle,
    angularSize = _angularSize,

    taskSliceIsDragging,
    taskSliceStoppedDragging,
    taskSliceDraggingOverBucket,
    taskSliceDraggingAwayFromBucket,
    taskSliceDroppedInBucket,

    slice = TaskDonut.drawingArea.path(),
    text = TaskDonut.drawingArea.text(),
    bucket_group = TaskDonut.drawingArea.g(),

    default_angular_rotation = 120,

    _initVectors,
    _calculateDrawingAttributes;

  init = function(startingAngle, angularSize, angularRotation) {

    _initVectors(startingAngle, angularSize, angularRotation);
    self.draw();
    bucket_group.add(slice, text);
  };

  _initVectors = function(startingAngle, angularSize, angularRotation) {

    self.angularRotation = (angularRotation || default_angular_rotation) + TaskDonut.angle_offset;

    self.startingAngle = startingAngle + Snap.rad(self.angularRotation);
    self.terminalAngle = self.startingAngle + angularSize;

    self.outerRadius = TaskDonut.outerRadius * 1.25;
    self.textRadius = self.outerRadius / 1.07;
    self.innerRadius = self.outerRadius / 1.17;

    self.outerTerminalVector = [
      (TaskDonut.centerX+self.outerRadius*Math.cos(self.terminalAngle)),
      (TaskDonut.centerY+self.outerRadius*Math.sin(self.terminalAngle))
    ];

    self.outerStartingVector = [
      (TaskDonut.centerX+self.outerRadius*Math.cos(self.startingAngle)),
      (TaskDonut.centerY+self.outerRadius*Math.sin(self.startingAngle))
    ];

    self.textVector = [
      (TaskDonut.centerX+self.textRadius*Math.cos(self.startingAngle + angularSize/2)),
      (TaskDonut.centerY+self.textRadius*Math.sin(self.startingAngle + angularSize/2))
    ];


    self.innerStartingVector = [
      (TaskDonut.centerX+self.innerRadius*Math.cos(self.startingAngle)),
      (TaskDonut.centerY+self.innerRadius*Math.sin(self.startingAngle))
    ];

    self.innerTerminalVector = [
      (TaskDonut.centerX+self.innerRadius*Math.cos(self.terminalAngle)),
      (TaskDonut.centerY+self.innerRadius*Math.sin(self.terminalAngle))
    ];

  };

  _calculateDrawingAttributes = function(){

    var sweep = (self.terminalAngle.mod(2*Math.PI) - self.startingAngle.mod(2*Math.PI) > Math.PI) ? 1 : 0;

    //category slice
    var move = "M"+self.innerStartingVector[0]+","+self.innerStartingVector[1];
    var arc = "A"+self.innerRadius+","+self.innerRadius+" 0 "+sweep+" 1 "+self.innerTerminalVector[0]+","+self.innerTerminalVector[1];
    var lineTo = "L"+self.outerTerminalVector[0]+","+self.outerTerminalVector[1];
    var outerArc = "A"+self.outerRadius+","+self.outerRadius+" 0 "+sweep+" 0 "+self.outerStartingVector[0]+","+self.outerStartingVector[1];
    var close = "L"+self.innerStartingVector[0]+","+self.innerStartingVector[1]+" z";
    var categorySlice = [move, arc, lineTo, outerArc, close].join(" ");
    var fill = "white";

    return {
      "d": categorySlice,
      "stroke": "#ededed",
      "stroke-width": .15,
      "fill":fill
    };
  };

  self.draw = function(){
    var drawingAttributes = _calculateDrawingAttributes();

    slice.attr(drawingAttributes);

    if(self.textLabel){
      text.attr({
        "text": self.textLabel,
        "text-anchor": "middle",
        "alignment-baseline": "central",
        "font-size": 3,
        "fill": "#cccccc"
      });

      var sliceBbox = slice.getBBox();

      text.attr({
        "x": sliceBbox.cx,
        "y": sliceBbox.cy
      });

    }

  };

  self.assign = function(assignObj){
    self.setText(assignObj.label);
  };

  self.setText = function(_text){
    self.textLabel = _text;
    self.draw();
  };

  self.g = function(){
    return bucket_group;
  };

  //Events
  taskSliceIsDragging = function(taskSlice, x, y){
    if(Snap.path.isPointInside(slice.toString(), x, y)){
      taskSliceDraggingOverBucket(taskSlice, x, y);
    }else{
      taskSliceDraggingAwayFromBucket(taskSlice, x, y);
    }
  };

  taskSliceStoppedDragging = function(taskSlice, x, y){
    if(Snap.path.isPointInside(slice.toString(), x, y)){
      console.log("bucket "+self.textLabel+" accepted drop from "+taskSlice.sliceIndex);
      taskSliceDroppedInBucket(taskSlice, x, y);
      eve("successfulTaskDropInBucket"+taskSlice.sliceIndex, {}, taskSlice);
    }else{
      console.log("bucket "+self.textLabel+" rejected drop from "+taskSlice.sliceIndex);
      eve("cancelledTaskSliceDropInBucket"+taskSlice.sliceIndex, {}, taskSlice);
    }
  };

  taskSliceDroppedInBucket = function(droppedTask){
    console.log("The task has been dropped in a bucket");
    bucket_group.removeClass("dragOver");
  };

  taskSliceDraggingOverBucket = function(taskSlice, x, y){
    bucket_group.addClass("dragOver");
  };

  taskSliceDraggingAwayFromBucket = function(taskSlice, x, y){
    bucket_group.removeClass("dragOver");
  };

  eve.on('taskSliceDragging', taskSliceIsDragging);
  eve.on('taskSliceStoppedDragging', taskSliceStoppedDragging);

  init(startingAngle, angularSize);

}
