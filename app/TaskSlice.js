/**
 * Created by jordanbradley on 10/22/15.
 */
var TaskSlice = function(TaskDonut, segmentIndex) {

    //private
    var self = this;
    var resizeSlice;
    var init;
    var HANDLE_SLICE_SIZE = 10;

    //exposed
    self.sliceIndex = segmentIndex;

    self.slice = TaskDonut.drawingArea.path();
    self.innerSlice = TaskDonut.drawingArea.path();

    self.innerStartingVectorLine = TaskDonut.drawingArea.line();
    self.innerTerminalVectorLine = TaskDonut.drawingArea.line();

    TaskDonut.donut_group.add(self.slice, self.innerSlice, self.innerStartingVectorLine, self.innerTerminalVectorLine);

    init = function(){

        self.task = TaskDonut.tasks[self.sliceIndex];
        self.localAngle = self.task.angleSize;

        self.drawingAngles = self.calculateDrawingAngles(self.task.angleSize);
        self.startingAngle = self.drawingAngles["startingAngle"];
        self.terminalAngle = self.drawingAngles["terminalAngle"];

        self.innerSliceRadius = TaskDonut.radius/1.03;
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

        var BUMPER = 10;
        self._willCauseOverlap = false;

        var total = 0;

        TaskDonut.slices.forEach(function(slice, index, array){
            total += slice.tempLocalAngle || slice.localAngle;
            if(index <= self.sliceIndex){
                var tempTerminalAngle = slice.tempTerminalAngle || slice.terminalAngle;
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
        var innerFill = "white";
        var emojiSlice = [innerMoveTo, innerLineTo, innerArc].join(" ");

        //emoji image
        if(self.emoji){
            self.emoji.remove();
        }
        var emojiWidth = 7,
            emojiHeight = emojiWidth;
        var emojiX = self.emojiVector[2] - (emojiWidth/2);
        var emojiY = self.emojiVector[3] - (emojiWidth/2);
        var emojiCenterX = emojiX + (emojiWidth/2);
        var emojiCenterY = emojiY + (emojiHeight/2);

        self.emoji = TaskDonut.drawingArea.image("/assets/emojis/72x72/1f1e9.png", emojiX, emojiY, emojiWidth, emojiHeight);
        self.emoji.attr({transform: "rotate("+(-TaskDonut.angle_offset) + " " + emojiCenterX +" "+ emojiCenterY +")"});
        TaskDonut.donut_group.add(self.emoji);
        self.emoji.drag(resizeSlice);

        //apply attributes
        self.innerStartingVectorLine.attr({x1: TaskDonut.centerX, y1: TaskDonut.centerY, x2: self.innerStartingVector[2], y2: self.innerStartingVector[3], stroke:"#cccccc", "stroke-width":.25});
        self.innerTerminalVectorLine.attr({x1: TaskDonut.centerX, y1: TaskDonut.centerY, x2: self.innerTerminalVector[2], y2: self.innerTerminalVector[3], stroke:"#cccccc", "stroke-width":.25});
        self.slice.attr({"d": categorySlice, stroke:"transparent", "stroke-width":.25, "fill":fill});
        self.innerSlice.attr({"d": emojiSlice, stroke:"white", "stroke-width":.25, "fill":innerFill});

        //apply special types
        if(self.task.taskType && self.task.taskType == "standardBreak"){
            self.slice.attr({"fill": "#5b6778"});
            self.innerSlice.attr({"fill": "transparent"});
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

        TaskDonut.donut_group.add(self.handle);

        self.handle.drag(resizeSlice);

    };

    resizeSlice = function(dx, dy, mx, my){

       //translate the mouse coordinates to the svg viewbox coordinates
        var root = TaskDonut.svgNode[0];

        var mousePoint = root.createSVGPoint();
        mousePoint.x = mx;
        mousePoint.y = my;

        var ctm = self.handle.node.getScreenCTM();

        if (ctm = ctm.inverse()){
            var relativeMousePoint = mousePoint.matrixTransform(ctm);
            console.log(mx, relativeMousePoint.x);
        }

        var relative_mx = relativeMousePoint.x;
        var relative_my = relativeMousePoint.y;

        var relative_center_x = TaskDonut.centerX;
        var relative_center_y = TaskDonut.centerY;

        var mouseAngle = Math.atan2(relative_my - relative_center_y, relative_mx - relative_center_x).mod(2*Math.PI);

        console.log(mouseAngle);

        var newLocalTheta = (Snap.deg((mouseAngle - self.terminalAngle)) + self.localAngle);

        self.tempLocalAngle = newLocalTheta;
        self.tempTerminalAngle = self.calculateDrawingAngles(newLocalTheta).terminalAngle;

        TaskDonut.redistributeTasks();

    };



    init();

};
