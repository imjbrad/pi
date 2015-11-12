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

    init = function(){

        self.tasks = self.tasks || _tasks;
        self.drawingArea = drawingArea;
        self.slices = [];
        self.total = 0;
        self.angle_offset = 30;

        validateTasks();
        determineSize();
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

        self.outerRadius = 100;
        self.radius = self.outerRadius/1.01;
        self.innerSliceRadius = self.radius/1.26;

        self.pictureRadius = self.innerSliceRadius/1.03;

        self.centerX = self.outerRadius;
        self.centerY = self.outerRadius;
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
        var shadow = drawingArea.filter(Snap.filter.shadow(0, 0, 2, "black", .35));
        outerCircle.attr({"cx":self.centerX, "cy":self.centerY, "r":self.outerRadius, "fill": "white"});

        //task ring, categories
        var patternImg = drawingArea.image("/assets/dark-stripes.png", 0, 0, 25, 25).attr({"opacity": .25});
        var pattern = patternImg.toPattern(0, 0, 25, 25);
        var circle = drawingArea.circle();
        circle.attr({"cx":self.centerX, "cy":self.centerY, "r":self.radius, "fill": pattern});

        //mask
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

        //draw handles
        self.slices.forEach(function(element, index, array){
            self.slices[index].drawHandle();
        });

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