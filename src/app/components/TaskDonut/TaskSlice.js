import { PiUtilities } from './../PiUtilities.js';

function findRelativeMouseAngle(mx, my, TaskDonut){
  var mousePoint = findRelativeMousePoints(mx, my, TaskDonut);
  var relative_mx = mousePoint.x;
  var relative_my = mousePoint.y;
  var relative_center_x = TaskDonut.centerX;
  var relative_center_y = TaskDonut.centerY;
  var mouseAngle = Math.atan2(relative_my - relative_center_y, relative_mx - relative_center_x).mod(Math.TWOPI);
  return Math.round(Snap.deg(mouseAngle));
}

export function TaskSlice(TaskDonut, _sliceDataObject) {

  //private
  var self = this;
  var HANDLE_SLICE_SIZE = 3;
  var sleepGradient = TaskDonut.drawingArea.gradient("l(0, 0, 1, 0)#F8B978-#5C6879");
  var mainSlicePath;
  var sliceAlreadyAnimating;

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

  function init(_sliceDataObject){

    self.startingAngle = 0;
    self.terminalAngle = 0;

    self.data = _sliceDataObject;

    var drawingAngles = findDrawingAngles(self.data.startAngle, self.data.endAngle);
    self.draw(drawingAngles.startingAngle, drawingAngles.terminalAngle);

    console.log(drawingAngles);
  }

  function findDrawingAngles(_start, _end){
    return {
      "startingAngle": Snap.rad(_start).mod(Math.TWOPI),
      "terminalAngle": Snap.rad(_end).mod(Math.TWOPI)
    }
  }
  
  function findVectors(_startingAngle, _terminalAngle){

    var angleSize = _terminalAngle - _startingAngle;

    return {
      startingVector: TaskDonut.toXY(_startingAngle, TaskDonut.radius),
      terminalVector: TaskDonut.toXY(_terminalAngle, TaskDonut.radius),
      innerStartingVector : TaskDonut.toXY(_startingAngle, self.mainSliceRadius),
      innerTerminalVector : TaskDonut.toXY(_terminalAngle, self.mainSliceRadius),
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


  self.redraw = function(_animate){

    var drawingAngles = findDrawingAngles(self.data.startAngle, self.data.endAngle);
    var speed = _animate ? 200 : 0;

    self.draw(drawingAngles.startingAngle, drawingAngles.terminalAngle, function () {
    }, speed);

  };


  self.draw = function (newStartAngle, newEndAngle, callback, _speed){
    var speed = _speed || 0;
    return Snap.animate([self.startingAngle, self.terminalAngle], [newStartAngle, newEndAngle], function(val){

      console.log("Animating");
      sliceAlreadyAnimating = true;

      var currentStartAngle = val[0];
      var currentEndAngle = val[1];

      var vectors = findVectors(currentStartAngle, currentEndAngle);
      var sweep = (currentEndAngle - currentStartAngle > Math.PI) ? 1 : 0;

      //border slice
      var borderSlice = makeBorderSliceString(
          vectors.startingVector.x, vectors.startingVector.y,
          TaskDonut.radius, vectors.terminalVector.x,
          vectors.terminalVector.y, vectors.innerStartingVector.x,
          vectors.innerStartingVector.y, self.mainSliceRadius,
          vectors.innerTerminalVector.x, vectors.innerTerminalVector.y, sweep
      );

      self.borderSlice.attr({stroke:"transparent", "stroke-width": 0, "fill": self.data.color || PiUtilities.colors.pieOrangeCream, 'd': borderSlice});

      if(self.data.name && self.data.name == "sleep"){
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
  init(_sliceDataObject);

}