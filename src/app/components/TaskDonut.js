/**
 * Created by jordanbradley on 12/1/15.
 */

import { BucketRing } from './BucketRing.js';
import { TaskSlice } from './TaskSlice.js';
import { PieUtilities } from './PiUtilities.js';
import { Emitter } from './Emitter.js';

export function TaskDonut(svgArea, _taskManager) {

  var self = this;
  var init;
  var determineSize;
  var determineAngleOffset;
  var drawingArea = svgArea;
  var pattern, patternImg;
  var taskManager = _taskManager;
  var tasks;

  self.dispatchedEvents = {};
  self.taskManager = taskManager;

  init = function(){

    tasks = taskManager.getTasks();

    patternImg = drawingArea.image("http://www.transparenttextures.com/patterns/debut-light.png", 0, 0, 100, 100).attr({"opacity": 1});
    pattern = patternImg.toPattern(0, 0, 100, 100);

    self.drawingArea = drawingArea;
    self.slices = [];
    self.total = 0;

    determineSize();
    determineAngleOffset();

    self.p = drawingArea.circle(self.centerX, self.centerY, 10);
    self.p.attr({transform: "rotate("+(self.angle_offset) + " " + self.centerX +" "+self.centerY+")"});

    eve.on("taskListUpdated", tasksListUpdated);

  };

  function tasksListUpdated(_animate){
    if(taskManager.taskListIsValid()){
      console.log("Tasks are valid, redrawing");
      self.drawSlices(_animate);
    }
  }

  determineAngleOffset = function(){

    var pie_sleep = taskManager.getSleepTasks();
    var totalConsecutiveSleepSize = 0;

    pie_sleep.forEach(function(sleep){
      totalConsecutiveSleepSize += (PieUtilities.toAngle(sleep.end) - PieUtilities.toAngle(sleep.start));
    });

    var sleep_midpoint = (PieUtilities.toAngle(pie_sleep[0]['end']) - (totalConsecutiveSleepSize/2));

    self.angle_offset = (90 - sleep_midpoint);

  };

  determineSize = function(){

    self.svgNode = $(self.drawingArea.node);

    self.outerRadius = 100;
    self.radius = self.outerRadius/1.01;
    self.sliceBorderRadius = self.radius/1.02;
    self.innerSliceRadius = self.radius/1.26;

    self.pictureRadius = self.innerSliceRadius/1.03;

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

  self.draw = function(){

    //outermost circle, white border w/ drop shadow
    var borderCircle = drawingArea.circle();
    var shadow = drawingArea.filter(Snap.filter.shadow(0, 0, 2, 'black', .2));
    borderCircle.attr({"cx":self.centerX, "cy":self.centerY, "r":self.outerRadius, "fill": "white", 'fill-opacity': "1"});

    //self portrait
    var pictureWidth = self.pictureRadius*2;
    var pictureHeight = pictureWidth;
    var pictureX = self.centerX - pictureWidth/2;
    var pictureY = self.centerY - pictureHeight/2;
    var picture = drawingArea.image("app/assets/terron.jpg", pictureX, pictureY, pictureWidth, pictureHeight)
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
    circle.attr({"cx":self.centerX, "cy":self.centerY, "r":self.radius, "fill": "#7e3c46", 'fill-opacity': ".1"});

    //create mask
    var donutMaskCircle = drawingArea.circle(self.centerX, self.centerY, self.outerRadius+5).attr({"fill":"white"});
    var donutMaskInnerCircle = drawingArea.circle(self.centerX, self.centerY, self.innerSliceRadius);
    var donutMask = drawingArea.g().add(donutMaskCircle, donutMaskInnerCircle);
    self.donut_group.add(borderCircle, circle);

    self.drawSlices();

    //draw task slice handles
    /*
     * It never occured to me that I could
     * love code. --not love code like loving
     * the activity of programming. It's occuring
     * to me right now that I love the code itself
     * -- the list of commands to the computer.
     * The amount of time i've spent with this code,
     * imagining all the things it could do,
     * embracing it as a material that is allowing
     * me to learn more about myself and the way
     * I go about each day. While the code itself
     * make up a list of commands, it's actually
     * a medium-- when the subject matter has
     * made itself such a personal product,
     * the code is really just my extended voice.
     * In a lot of ways it is a bookmark of what
     * I am telling myself I need at a point in life
     * When you program something you're telling the
     * computer what you need- whether you need a basic
     * calculator, or in this case a personal
     * daily planner, you are first recgonizing
     * what you need at a particular instant or moment
     * in your life, then with your voice, shaping the
     * medium and fashioining it into the thing you need,
     * the thing you want to see. Therefore you spend time
     * with it. As you make it the thing you need, you
     * think more and more about what that thing really is
     * and what that thing is at its core- you're foreced to
     * understnad the solution to the problem you are experiencing
     * in your life at that time. You are litterally working
     * through a problem. In that, just code can be
     * a deeply personal medium... it can be a documentation
     * of a moment in ones life.
     * */


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

    //apply masks
    self.donut_group.attr({mask: donutMask});
    self.donut_group.attr({transform: "rotate("+self.angle_offset + " " + self.centerX +" "+self.centerY+")"});

  };

  self.redraw = function(){
    self.drawingArea.clear();

    init();
    self.draw();
  };

  self.drawSlices = function(_animate){

    //redraw slices for each task
    tasks.forEach(function(element, index, array){

      var slice = self.slices[index];

      if(!slice){
        //instantiate a slice for the first time
        slice = new TaskSlice(self, index);
        self.slices.push(slice);
      }else{
        //redraw an existing slice
        slice.redraw(_animate);
      }

    });

  };

  /**
   *
   * There's this separation between what I am
   * immeditatly conscious of and what is actually
   * happening. The things I say I want to do
   * at the beginning of the day might include:
   * "go to the bank"
   * "walk the dog"
   * ..but that list isn't considering the implicit
   * tasks of the day like
   * "sleep"
   * "brush teeth"
   * "move legs"
   * there is this process that must happen where
   * "my" tasks are weaved into the "natural" or
   * "implicit tasks"
   *
   * I was trying to figure out if I should
   * hide sleep from the list because of it's
   * implicit nature but i think that's more
   * of a reason I should show it
   *
   * **/

  init();

  if(taskManager.taskListIsValid()){
    self.draw();
  }

}
