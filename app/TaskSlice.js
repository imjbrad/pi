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
    self.handle = TaskDonut.drawingArea.path();
    TaskDonut.donut_group.add(self.slice, self.handle);

    init = function(){

        self.task = TaskDonut.tasks[self.sliceIndex];
        self.localAngle = self.task.angleSize;

        self.drawingAngles = self.calculateDrawingAngles(self.task.angleSize);
        self.startingAngle = self.drawingAngles["startingAngle"];
        self.terminalAngle = self.drawingAngles["terminalAngle"];

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

        var handleVector = [
            TaskDonut.centerX,
            TaskDonut.centerY,
            (TaskDonut.centerX+TaskDonut.radius*Math.cos(self.terminalAngle - Snap.rad(HANDLE_SLICE_SIZE))),
            (TaskDonut.centerY+TaskDonut.radius*Math.sin(self.terminalAngle - Snap.rad(HANDLE_SLICE_SIZE)))
        ];

        self.startingVector = startingVector;
        self.terminalVector = terminalVector;
        self.handleVector = handleVector;

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

    self.draw = function() {

        var sweep = (self.terminalAngle.mod(2*Math.PI) - self.startingAngle.mod(2*Math.PI) > Math.PI) ? 1 : 0;
        var moveTO = "M"+TaskDonut.centerX+","+TaskDonut.centerY;
        var lineTo = "L"+self.startingVector[2]+","+self.startingVector[3];
        var arc = "A"+TaskDonut.radius+","+TaskDonut.radius+" 0 "+sweep+" 1 "+self.terminalVector[2]+","+self.terminalVector[3]+" z";
        var fill = self.task.color || "black";

        var handleMoveTO = "M"+TaskDonut.centerX+","+TaskDonut.centerY;
        var handleLineTo = "L"+self.handleVector[2]+","+self.handleVector[3];
        var handleArc = "A"+TaskDonut.radius+","+TaskDonut.radius+" 0 0 1 "+self.terminalVector[2]+","+self.terminalVector[3]+" z";
        self.slice.attr({"d": moveTO+" "+lineTo+" "+arc, "stroke-width": 2, "stroke":"white", "fill":fill});
        self.handle.attr({"d": handleMoveTO+" "+handleLineTo+" "+handleArc, "fill":"transparent"});

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

    self.handle.drag(resizeSlice);

    init();

};
