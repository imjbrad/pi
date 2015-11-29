/**
 * Created by jordanbradley on 10/22/15.
 */


var TaskDonut = function(svgArea, _tasks){

    var self = this;
    var init;
    var determineSize;
    var validateTasks;
    var drawCircle;
    var drawTasks;
    var drawingArea = svgArea;

    var patternImg = drawingArea.image("/assets/dark-stripes.png", 0, 0, 25, 25).attr({"opacity": .25});
    var pattern = patternImg.toPattern(0, 0, 25, 25);

    init = function(){

        self.tasks = self.tasks || _tasks;
        self.drawingArea = drawingArea;
        self.slices = [];
        self.total = 0;
        self.angle_offset = 30;

        validateTasks();
        determineSize();

        self.bucket_ring = new BucketRing(self);
        self.draw();
    };

    validateTasks = function(){
        var foundSleep;
        self.tasks.forEach(function(task, index, array){
            if(task.taskType && task.taskType == "standardSleep"){
               foundSleep = true;
                return false;
            }
        });

        if(foundSleep){
            console.log("Found sleep");
        }else{
            console.log("No sleep found, Adding 8 hours of sleep");

            //fill in a standard day
            //
            var standardSleep = {
                name: "Sleep",
                angleSize: 120,
                color: "#5b6778",
                taskType: "standardSleep"
            };

            self.tasks.unshift(standardSleep);
        }

    };

    determineSize = function(){
        self.svgNode = $(self.drawingArea.node);

        self.categoryOuterRadius = 100;
        self.categoryInnerRadius = self.categoryOuterRadius/1.17;

        self.outerRadius = self.categoryInnerRadius/1.06;
        self.radius = self.outerRadius/1.01;
        self.innerSliceRadius = self.radius/1.26;

        self.pictureRadius = self.innerSliceRadius/1.02;

        self.centerX = self.categoryOuterRadius;
        self.centerY = self.categoryOuterRadius;

    };

    self.draw = function(){

        //self portrait
        var pictureWidth = self.pictureRadius*2;
        var pictureHeight = pictureWidth;
        var pictureX = self.centerX - pictureWidth/2;
        var pictureY = self.centerY - pictureHeight/2;
        var picture = drawingArea.image("/assets/andrew.jpg", pictureX, pictureY, pictureWidth, pictureHeight);

        //mask self portrait
        var pictureMask = drawingArea.circle();
        pictureMask.attr({"cx":self.centerX, "cy":self.centerY, "r":self.pictureRadius, "fill":"white"});
        picture.attr({mask: pictureMask});

        //ring group
        self.donut_group = self.drawingArea.g();

        //outermost ring, white border
        var outerCircle = drawingArea.circle();
        var shadow = drawingArea.filter(Snap.filter.shadow(0, 0, 2, "black", .17));
        outerCircle.attr({"cx":self.centerX, "cy":self.centerY, "r":self.outerRadius, "fill": "white"});

        outerCircle.attr({filter: shadow});

        //task ring, categories
        var circle = drawingArea.circle();
        circle.attr({"cx":self.centerX, "cy":self.centerY, "r":self.radius, "fill": pattern});

        //create mask
        var donutMaskCircle = drawingArea.circle(self.centerX, self.centerY, self.outerRadius+5).attr({"fill":"white"});
        var donutMaskInnerCircle = drawingArea.circle(self.centerX, self.centerY, self.innerSliceRadius);
        var donutMask = drawingArea.g().add(donutMaskCircle, donutMaskInnerCircle);
        self.donut_group.add(outerCircle, circle);

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
         * the thing you want to see. Therefore you spent time
         * with it. As you make it the thing you need, you
         * think more and more about what that thing really is
         * and what that thing is at its core- you're foreced to
         * understnad the solution to the problem you are experiencing
         * in your life at that time. You are litterally working
         * through a problem. In that, just code can be
         * a deeply personal medium... it can be a documentation
         * of a moment in ones life.
        * */

         self.slices.forEach(function(element, index, array){
            self.slices[index].drawHandle();
        });

        //apply masks
        self.donut_group.attr({mask: donutMask});
        self.donut_group.attr({transform: "rotate("+self.angle_offset + " " + self.centerX +" "+self.centerY+")"});

        //self.coverGroup = drawingArea.g();
        //
        //self.coverCircle = drawingArea.circle();
        //self.coverCircle.attr({"cx": self.centerX, "cy": self.centerY, "r":self.radius, "fill": "rgba(255, 255, 255, .95)"});
        //
        //self.svgCoverText = drawingArea.text();
        //self.svgCoverText.attr({"x": self.centerX, "y": self.centerY, "text": self.coverText, "text-anchor": "middle"});
        //
        //self.coverGroup.add(self.coverCircle, self.svgCoverText);
        //self.coverGroup.node.style.display = "none";

    };

    self.showWeeklyBuckets = function(){

    };

    self.hideWeeklyBuckets = function(){

    };

    self.redistributeTaskAtIndex = function(index){
        var slice = self.getSliceAtIndex(index);

        if(slice.willCauseOverlap() == false){
            self.tasks[index].angleSize = slice.tempLocalAngle || self.tasks[index].angleSize;
        }

        slice.tempLocalAngle = undefined;
        slice.tempTerminalAngle = undefined;

    };

    self.redistributeTasks = function(){

        self.tasks.forEach(function(task, index, array){
            self.redistributeTaskAtIndex(index);
        });

        self.redrawSlices();
        self.dispatch("updated", [self.tasks]);
    };

    self.redraw = function(){
        self.drawingArea.clear();
        init();
    };

    self.redrawSlices = function(){
        //redraw slices
        self.slices.forEach(function(element, index, array){
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

    self.onupdated = function(eventHandlerFunction){
        self.updated = eventHandlerFunction;
    };

    self.dispatchUpdate = function(){
        self.dispatch("updated", [self.tasks]);
    };

    self.dispatch = function(eventName, argList){
        if(self[eventName] && self[eventName].call){
            self[eventName](self, argList);
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

};