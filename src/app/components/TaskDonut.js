/**
 * Created by jordanbradley on 12/1/15.
 */

import { BucketRing } from './BucketRing.js';
import { TaskSlice } from './TaskSlice.js';

export function TaskDonut(svgArea, _tasks) {

  var self = this;
  var init;
  var determineSize;
  var validateTasks;
  var drawCircle;
  var drawTasks;
  var determineAngleOffset;
  var drawingArea = svgArea;
  var pattern, patternImg;
  var TASK_TYPES = ["sleep"];
  var REQUIRED_SLICE_KEYS = ["name", "startingAngle", "terminalAngle"];
  var pie_sleep = [];

  self.dispatchedEvents = {};

  init = function(){

    patternImg = drawingArea.image("http://www.transparenttextures.com/patterns/debut-light.png", 0, 0, 100, 100).attr({"opacity": 1});
    pattern = patternImg.toPattern(0, 0, 100, 100);

    self.tasks = self.tasks || _tasks;
    self.drawingArea = drawingArea;
    self.slices = [];
    self.total = 0;

    if(self.validatePie()){
      determineSize();
      determineAngleOffset();

      self.bucket_ring = new BucketRing(self);
      self.draw();
    }
  };

  determineAngleOffset = function(){

    var totalConsecutiveSleepSize = 0;

    pie_sleep.forEach(function(sleep){
      totalConsecutiveSleepSize += (sleep.terminalAngle - sleep.startingAngle);
    });

    var sleep_midpoint = (pie_sleep[pie_sleep.length-1].terminalAngle - (totalConsecutiveSleepSize/2));
    self.angle_offset = Snap.deg((Snap.rad(-90) + sleep_midpoint));
    console.log(self.angle_offset);

  };

  self.validatePie = function(){

    console.log("Validating Pie");

    if(!validateTasks()){
      console.log("Pie couldn't validate all tasks");
      return false;
    }

    if(!(pie_sleep.length)){
      console.log("Pie doesn't have require sleep tasks");
      return false;
    }

    return true;

  };

  self.validateTask = function(task){

    var valid = true;

    REQUIRED_SLICE_KEYS.forEach(function(key, index, array){
      if(!(key in task)){
        console.log("task is missing required key: "+key);
        valid = false;
      }
    });

    if(task.type && (TASK_TYPES.indexOf(task.type) == -1)){
      console.log("task "+task.name+" has an invalid task type "+task.type);
      valid = false;
    }

    if(task.type == 'sleep'){
      pie_sleep.push(task);
    }

    return valid;

  };

  validateTasks = function(){
    console.log("Validating tasks");


    var valid = true;

    self.tasks.every(function(task, index, array){
      valid = self.validateTask(task);
      return valid;
    });

    return valid;
  };

  determineSize = function(){

    self.svgNode = $(self.drawingArea.node);

    self.outerRadius = 100;
    self.radius = self.outerRadius/1.01;
    self.sliceBorderRadius = self.radius/1.02;
    self.innerSliceRadius = self.radius/1.26;

    self.pictureRadius = self.innerSliceRadius/1.1;

    self.centerX = self.outerRadius;
    self.centerY = self.outerRadius;

  };

  self.draw = function(){

    //outer, blurred self portrait
    var outerPictureWidth = self.innerSliceRadius*2;
    var outerPictureHeight = outerPictureWidth;
    var outerPictureX = self.centerX - outerPictureWidth/2;
    var outerPictureY = self.centerY - outerPictureHeight/2;
    var blur = drawingArea.filter(Snap.filter.blur(4, 4));
    var outerPicture = drawingArea.image("app/assets/andrew.jpg", outerPictureX, outerPictureY, outerPictureWidth, outerPictureHeight)
        .attr({filter: blur});

    //self portrait
    var pictureWidth = self.pictureRadius*2;
    var pictureHeight = pictureWidth;
    var pictureX = self.centerX - pictureWidth/2;
    var pictureY = self.centerY - pictureHeight/2;
    var picture = drawingArea.image("app/assets/andrew.jpg", pictureX, pictureY, pictureWidth, pictureHeight)
        //.attr({filter: drawingArea.filter(Snap.filter.grayscale(.5))})
        ;

    //mask self portrait
    var pictureMask = drawingArea.circle();
    pictureMask.attr({"cx":self.centerX, "cy":self.centerY, "r":self.pictureRadius, "fill":"white"});
    picture.attr({mask: pictureMask});

    //mask outer self portrait
    var outerPictureMask = drawingArea.circle();
    outerPictureMask.attr({"cx":self.centerX, "cy":self.centerY, "r":self.innerSliceRadius, "fill":"white"});
    outerPicture.attr({mask: outerPictureMask, opacity: .6});

    //ring group
    self.donut_group = self.drawingArea.g();

    //outermost ring, white border
    //var outerCircle = drawingArea.circle();
    //var shadow = drawingArea.filter(Snap.filter.shadow(0, 0, 2, "black", .17));
    //outerCircle.attr({"cx":self.centerX, "cy":self.centerY, "r":self.outerRadius, stroke: "white", fill:"transparent", filter: shadow});

    //task ring, categories
    var circle = drawingArea.circle();
    circle.attr({"cx":self.centerX, "cy":self.centerY, "r":self.radius, "fill": "#fbfcfc", 'fill-opacity': ".23"});

    //create mask
    var donutMaskCircle = drawingArea.circle(self.centerX, self.centerY, self.outerRadius+5).attr({"fill":"white"});
    var donutMaskInnerCircle = drawingArea.circle(self.centerX, self.centerY, self.innerSliceRadius);
    var donutMask = drawingArea.g().add(donutMaskCircle, donutMaskInnerCircle);
    self.donut_group.add(circle);

    //add task slices
    self.tasks.forEach(function(element, index, array){
      var task = element,
        orderNumber = index,
        tasksArray = array,
        taskTheta = task.angleSize;
      self.slices.push(new TaskSlice(self, index));
    });

    //draw task slices
    self.slices.forEach(function(element, index, array){
      self.slices[index].draw();
    });

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

     self.slices.forEach(function(element, index, array){
      self.slices[index].drawHandle();
    });

    //apply masks
    self.donut_group.attr({mask: donutMask});
    self.donut_group.attr({transform: "rotate("+self.angle_offset + " " + self.centerX +" "+self.centerY+")"});

  };

  self.redistributeTaskAtIndex = function(index){
    var slice = self.getSliceAtIndex(index);

    if(slice.willCauseOverlap() == false){
      slice._applyTempData();
    }

    slice.tempData = {};

    self.redrawSlices();

  };

  self.redistributeTasks = function(){

    self.tasks.forEach(function(task, index, array){
      self.redistributeTaskAtIndex(index);
    });

    //self.redrawSlices();
  };

  self.redraw = function(){
    self.drawingArea.clear();
    init();
  };

  self.redrawSlices = function(){
    //redraw slices for each task
    self.tasks.forEach(function(element, index, array){
      self.slices[index].redraw();
    });

    //redraw handles
    self.slices.forEach(function(element, index, array){
      self.slices[index].redrawHandle();
    });

  };

  self.getSliceAtIndex = function(i){
    return self.slices[i];
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

  self.updateTasks = function(newTaskSet){
    self.tasks = newTaskSet;
    self.redraw();
  };

  /*
  * The default add task
  * behavior will add a
  * task the first place
  * it has space
  * */
  self.addTask = function(task){

    var canPlaceTask = false;
    var newStartingAngle;
    var placeIndex;

    self.slices.every(function(slice, index, array){
      var nextSlice = array[index + 1];
      var terminalAngle = slice.terminalAngle;
      newStartingAngle = Snap.rad(task.startingAngle) || terminalAngle;

      if(nextSlice){
        var nextStartingAngle = nextSlice.startingAngle;
        if(nextStartingAngle >= (newStartingAngle + Snap.rad(task.angleSize))) {
          placeIndex = index+1;
          console.log("space available at "+placeIndex);
          canPlaceTask  = true;
          return false;
        }
      }else{
        placeIndex = index+1;
        console.log("no next slice, space available immediatly at "+placeIndex);
        canPlaceTask = true;
        return false;
      }
    });

    if(canPlaceTask){
      console.log("placing task");
      task['startingAngle'] = Snap.deg(newStartingAngle);
      self.tasks.splice(placeIndex, 0, task);
      self.slices.splice(placeIndex, 0, new TaskSlice(self, placeIndex));
      self.redistributeTasks();
    }else{
      console.log("No room for task");
    }

   };

  self.onUserUpdatedDonutManually = function(eventHandlerFunction){
    self.dispatchedEvents["userUpdatedDonutManually"] = eventHandlerFunction;
  };

  self.dispatch = function(eventName, argList){
    if(self.dispatchedEvents[eventName] && self.dispatchedEvents[eventName].call){
      self.dispatchedEvents[eventName].apply(self, argList);
    }
  };

  self.setCoverText = function(text){
    self.coverText = text;
    self.svgCoverText.attr({"text": self.coverText});
    self.coverGroup.node.style.display = "initial";
    //var f = self.drawingArea.filter(Snap.filter.blur(5, 10));
    //self.donut_group.attr({filter: f});
  };

  self.setTag = function(tagString){
    self.tag = tagString;
  };

  self.setIndex = function(indexNumber){
    self.index = indexNumber;
  };

  init();

}
