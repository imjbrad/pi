/**
 * Created by jordanbradley on 12/1/15.
 */

import { TaskSlice } from './TaskSlice.js';
import { PiUtilities } from './../PiUtilities.js';
import { Emitter } from './../Emitter.js';

export function TaskDonut(svgArea, _taskManager) {

  var self = this;
  var init;
  var determineSize;
  var determineAngleOffset;
  var drawingArea = svgArea;
  var pattern, patternImg;
  var taskManager = _taskManager;
  var tasks;
  var picture;

  self.dispatchedEvents = {};
  self.taskManager = taskManager;
  self.slices = [];
  self.sliceDataObjects = [];
  self.picture = null;

  init = function(){

    tasks = taskManager.getTasks();

    patternImg = drawingArea.image("http://www.transparenttextures.com/patterns/debut-light.png", 0, 0, 100, 100).attr({"opacity": 1});
    pattern = patternImg.toPattern(0, 0, 100, 100);

    self.drawingArea = drawingArea;
    self.slices = [];
    self.total = 0;

    determineSize();

    self.p = drawingArea.circle(self.centerX, self.centerY, 10);
    self.p.attr({transform: "rotate("+(self.angle_offset) + " " + self.centerX +" "+self.centerY+")"});

    self.picture = self.taskManager.picture() || null;

    console.log(self.picture);

    eve.on("taskListUpdated", tasksListUpdated);

  };

  function tasksListUpdated(_animate){
    if(taskManager.taskListIsValid()){
      console.log("Tasks are valid, redrawing");
      self.drawSlices(_animate);
    }else{
      console.log("Tasks not valid, not redrawing")
    }
  }

  function calculateSleepAngleSize() {
    var anticipatedSleepTimeInMinutes = taskManager.getAnticipatedSleepTime(),
        wholeDayInMinutes = moment.duration(24, "hours").as("minutes"),
        sleep_ratio = anticipatedSleepTimeInMinutes / wholeDayInMinutes;

    return sleep_ratio * 360;
  }

  function calculateProductiveTimeAngleSize(){
    return PiUtilities.toAngleSize(taskManager.getProductiveTimeInMinutes());
  }

  determineSize = function(){

    self.svgNode = $(self.drawingArea.node);

    self.outerRadius = 100;
    self.radius = self.outerRadius;
    self.sliceBorderRadius = self.radius/1.03;
    self.innerSliceRadius = self.sliceBorderRadius;

    self.pictureRadius = self.innerSliceRadius/1.036;

    self.centerX = self.outerRadius;
    self.centerY = self.outerRadius;

  };

  self.toXY = function(angleInRadians, r){
    return {
      x: self.centerX+r*Math.cos(angleInRadians),
      y: self.centerY+r*Math.sin(angleInRadians)
    }
  };

  self.toPolar = function(x, y){
    return {
      angle: Math.atan2(y, x).mod(Math.TWOPI),
      r: math.distance([x, y], [self.centerX, self.centerY])
    }
  };

  self.draw = function(_animate){

    self.angle_offset = 90 - (calculateSleepAngleSize()/2);

    //outermost circle, white border w/ drop shadow
    var borderCircle = drawingArea.circle();
    var shadow = drawingArea.filter(Snap.filter.shadow(0, 0, 2, 'black', .2));
    borderCircle.attr({"cx":self.centerX, "cy":self.centerY, "r":self.outerRadius, "fill": "white", 'fill-opacity': "1"});

    if(picture){
      picture.remove();
    }

    //self portrait
    var pictureWidth = self.pictureRadius*2;
    var pictureHeight = pictureWidth;
    var pictureX = self.centerX - pictureWidth/2;
    var pictureY = self.centerY - pictureHeight/2;
    picture = drawingArea.image(self.picture, pictureX, pictureY, pictureWidth, pictureHeight)
      //.attr({filter: drawingArea.filter(Snap.filter.grayscale(.5))})
    ;



    //mask self portrait
    var pictureMask = drawingArea.circle();
    pictureMask.attr({"cx":self.centerX, "cy":self.centerY, "r":self.pictureRadius, "fill":"white"});
    picture.attr({mask: pictureMask});

    //ring group
    self.donut_group = self.drawingArea.g();

    //task ring, categories
    var circle = drawingArea.circle();
    circle.attr({"cx":self.centerX, "cy":self.centerY, "r":self.radius, "fill": "#cccccc", 'fill-opacity': "1"});

    //create mask
    var donutMaskCircle = drawingArea.circle(self.centerX, self.centerY, self.outerRadius+5).attr({"fill":"white"});
    var donutMaskInnerCircle = drawingArea.circle(self.centerX, self.centerY, self.innerSliceRadius);
    var donutMask = drawingArea.g().add(donutMaskCircle, donutMaskInnerCircle);
    self.donut_group.add(borderCircle, circle);

    self.drawSlices(_animate);

    //draw task slice handles
    //apply masks
    self.donut_group.attr({mask: donutMask});
    self.donut_group.attr({transform: "rotate("+self.angle_offset + " " + self.centerX +" "+self.centerY+")"});

  };

  self.redraw = function(_animate){
    self.drawingArea.clear();

    init();
    self.draw(_animate);
  };

  self.drawSlices = function(_animate){

    if(!self.picture)
      return;

    var sleepSize = calculateSleepAngleSize(),
        productiveSize = calculateProductiveTimeAngleSize(),
        sleepSlice = {
          name: "sleep",
          startAngle:  0,
          endAngle: sleepSize
        };

    var productiveSlice = {name: "tasks", color: "grey", startAngle: sleepSlice.endAngle};
    productiveSlice.endAngle = productiveSlice.startAngle + productiveSize;

    self.sliceDataObjects.push(sleepSlice, productiveSlice);

    self.sliceDataObjects.forEach(function(_sliceDataObject){

    var slice = self.slices.find(function(slice){
      return slice.data.name == _sliceDataObject.name;
    });

    if (!slice) {
      slice = new TaskSlice(self, _sliceDataObject);
      self.slices.push(slice);
    } else {
      slice.redraw(true);
    }

  });

  };

  self.refreshPhoto = function(uri){
    console.log("refreshing");
    self.picture = uri;
    self.redraw();
  };

  init();

  if(taskManager.taskListIsValid()){
    self.draw();
  }

}

/*
 * I wrote this a few days ago as a rewrite of ^
 * I think this gets the idea more:
 *
 * A programmer is tasked with dictating to a machine in great
 * detail, his needs and concerns. The machine listens and works
 * to serve the programmer. However, as is the case with any situation
 * in life, one must have an understanding of an issue before exploring
 * a solution. So, in the case of creating tools and expressions with
 * code, those aesthetic or contextual issues exist at a personal
 * level, and therefore require a personal meditation to conquer.
 *
 * Thus, code becomes a medium. It becomes a deeply personal thing in
 * which a programmer becomes more an artist or craftsperson. He is
 * tasked with molding and shaping with his voice, a satisfying,
 * functioning image.. an attempt at representing answers to a persons
 * most challenging and persistent questions
 *
 * */
