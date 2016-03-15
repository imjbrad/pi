import { PieUtilities } from './PiUtilities.js';

/*This serves as
* the main controller
* for set of data
* for one day. it enforces the
* model, validates data,
* provides an API for
* updating data, and will eventually
* persist data to Parse
* */

 export function TaskSetController(_dayDataObject) {

    var self = this,
        userDayObject,
        sleep = [],
        utilities = self.utilities = {};

    var REQUIRED_TASK_KEYS = ["name", "start", "end"],
        TASK_TYPES = ["sleep", "temp"];

    var __temp = "";

    self.MINIMUM_TASK_SIZE = 10;

    function init(_dayDataObject){

        console.log("TaskSet Controller initialized w/ a task data");
        userDayObject = _dayDataObject;

        if(_validateDay(userDayObject)) {

            window.setTimeout(function(){
                _taskListUpdated();
            }, 0);
        }

    }

    function ___taskWouldHappenOnTheWrongDay(startingTime, terminalTime){
        if((terminalTime.get('date') != userDayObject.day.get('date')) ||
            (startingTime.get('date') != userDayObject.day.get('date'))){
            console.log("Task cannot happen on a day different than the one specified by the day object", terminalTime.get('date'), startingTime.get('date'), userDayObject.day.get('date'));
            return true;
        }
        return false;
    }

    function ___taskWouldSpanSeveralDays(startingTime, terminalTime){
        if(terminalTime.get('date') != startingTime.get('date')){
            console.log("Task cannot span several days");
            return true;
        }
        return false;
    }

    function ___taskWouldEndBeforeItStarts(startingTime, terminalTime){
        if(terminalTime.isBefore(startingTime) || startingTime.isAfter(terminalTime)){
            console.log("Task cannot end before it starts");
            return true;
        }
        return false;
    }

    function ___taskWouldOverlapPreviousTask(task, taskList){
        var index = task.id,
            previousIndex = (index == 0) ? taskList.length - 1 : index - 1,
            previousTask = taskList[previousIndex],
            previousEndTime = moment(previousTask.end),
            startingTime = moment(task.start);

        if(index > 0 && (startingTime.isBefore(previousEndTime))){
            console.log("Task can't collide with previous task");
            return true;
        }
        return false;
    }

    function ___taskWouldOverlapNextTask(task, taskList){
        var index = task.id,
            last = taskList.length - 1,
            nextIndex = (index == last) ? 0 : index + 1,
            nextTask = taskList[nextIndex],
            nextStartTime = moment(nextTask.start),
            terminalTime = moment(task.end);

        if(index < last && (nextStartTime.isBefore(terminalTime))){
            console.log(task.name+"("+task.id+") can't overlap next task: "+nextTask.name+"("+nextTask.id+")");
            return true;
        }

        return false;
    }

    function ___taskWouldBeTooSmall(task){
        var MINIMUM = 10;
        var taskSize = PieUtilities.taskSize(task.start, task.end);
        if(taskSize < MINIMUM){
            console.log("Task can't be too smaller than "+MINIMUM+" minimum", taskSize);
            return true;
        }
        return false
    }

    function __taskWouldCauseOverlap(_task, _taskList){
        var task = _task,
            taskList = _taskList,
            startingTime = moment(task.start),
            terminalTime = moment(task.end);

        //console.log("Validating: "+task.name);

        return (
            ___taskWouldHappenOnTheWrongDay(startingTime, terminalTime)||
            ___taskWouldSpanSeveralDays(startingTime, terminalTime)||
            ___taskWouldEndBeforeItStarts(startingTime, terminalTime)||
            ___taskWouldOverlapNextTask(task, taskList) ||
            ___taskWouldOverlapPreviousTask(task, taskList)||
            ___taskWouldBeTooSmall(task));
    }

    function _validateTask(task, index, _taskList){
        var valid = true;

        //task has an ID
        task.id = index;

        //task has temp data
        if(!task.tempData)
            task.tempData = {};

        //task has required keys
        REQUIRED_TASK_KEYS.forEach(function(key, index, array){
            if(!(key in task)){
                console.log("task is missing required key: "+key);
                valid = false;
            }
        });

        //task has an invalid task type
        if(task.type && (TASK_TYPES.indexOf(task.type) == -1)){
            console.log("task "+task.name+" has an invalid task type "+task.type);
            valid = false;
        }

        //task won't cause overlap
        if(__taskWouldCauseOverlap(task, _taskList)){
            console.log("task would cause an overlap " + task.name);
            valid = false;
        }

        //push sleep
        if(task.type == 'sleep'){
            sleep.push(task);
        }

        return valid;
    }

    function _validateTaskListForDay(__taskList){

        var list = __taskList,
            valid = true;

        sleep = [];

        self._taskListIsValid = true;

        list.sort(function(taskA, taskB){
            var a = moment(taskA.start);
            var b = moment(taskB.start);

            if(a.isBefore(b)){
                return -1
            }

            if(a.isAfter(b)){
                return 1;
            }

            return 0;

        });

        list.every(function(_task, _taskIndex, _taskList){
            valid = _validateTask(_task, _taskIndex, _taskList);
            return valid;
        });

        self._taskListIsValid = valid;
        return valid;
    }

    function _validateDay(__dayData){
        console.log("Validating Day");

        var valid = true,
            taskList = __dayData.tasks;

        valid = _validateTaskListForDay(taskList);

        if(valid){
            console.log("Passed Validation");
        }

        return valid;
    }

    function _updateTasksByInsertAndRipple(taskA, taskB, _updateMethod){

        var place = _updateMethod.split('-')[1];
        console.log(place);

        //first figure out if taskA is moving into the future or in the past
        var moveDirection = moment(taskB.start).isAfter(taskA.start) ? "forward" : "past";

        var taskASize = PieUtilities.taskSize(taskA.start, taskA.end);

        //insert taskA at taskB
        if(place == "before"){
            taskA.start = taskB.start;
            taskA.end = moment(taskA.start).add(taskASize, 'm').format();
        }

        else if(place == "after"){
            taskA.start = taskB.end;
            taskA.end = moment(taskA.start).add(taskASize, 'm').format();
        }

        //if taskA is moved into a time in the future...
        if(moveDirection == "forward"){

            /*
            * If taskA is being inserted at the start of taskB, Push taskB and
            * each task after it taskA-minutes into the future. If taskA is being
            * inserted at the end of taskB, push each task after taskB taskA-minutes
            * into the future
            * */
             var start = (place == "before") ? taskB.id : taskB.id+1;

             for(var i=start; i<userDayObject.tasks.length-1; i++){
                var task = self.getTask(i),
                    taskSize = PieUtilities.taskSize(task.start, task.end);

                    task.start = moment(task.start).add(taskASize, 'm').format();
                    task.end = moment(task.start).add(taskSize, 'm').format();
                    console.log("shifting forward "+task.name);
            }

            /*
            * Then, each task after taskA's original position
            * need to be shifted taskA-minutes earlier to re-balance
            * the Pie
            * */
            for(var i=taskA.id; i<userDayObject.tasks.length-1; i++){
                var task = self.getTask(i),
                    taskSize = PieUtilities.taskSize(task.start, task.end);
                task.start = moment(task.start).subtract(taskASize, 'm').format();
                task.end = moment(task.start).add(taskSize, 'm').format();
                console.log("shifting back "+task.name);
            }
        }

         //If taskB is moved into the past
         if(moveDirection == "past"){

             /*
              * If taskA is being inserted at the start of taskB, push taskB and
              * each task after it, up to taskA's original position, taskA-minutes
              * into the future to re-balance the Pie. If taskA is being inserted
              * at the end of taskB, push each task after taskB, up to taskA's original
              * position taskA-minutes into the future to re-balanace the Pie.
              * */
             var start = (place == "before") ? taskB.id : taskB.id+1;
             for(var i=start; i<taskA.id; i++){
                var task = self.getTask(i),
                    taskSize = PieUtilities.taskSize(task.start, task.end);
                task.start = moment(task.start).add(taskASize, 'm').format();
                task.end = moment(task.start).add(taskSize, 'm').format();
                console.log("shifting forward "+task.name);
             }
        }

        return _validateTaskListForDay(userDayObject.tasks);

    }

    /*
    * Similar to a ripple edit in Premiere
    * when you change the size of one task,
    * it shifts all the other tasks earlier
    * or later, accordingly
    * */
     function _updateTaskByPushPull(_dirtyTask, rippleMethod){

        var task = _dirtyTask,
            startingTime = moment(task.start),
            terminalTime = moment(task.end);

        console.log("starting ripple");

        var rippleHandle = rippleMethod.split('-')[0];

         var prevHandle = moment(task.tempData['prev-'+rippleHandle]);
         var newHandle = moment(task[rippleHandle]);

         var rippleDifferenceMs = newHandle.diff(prevHandle);

         console.log(newHandle.diff(prevHandle, 'm'));

         if(rippleMethod == "end-push-pull"){
             for(var i = task.id+1; i < userDayObject.tasks.length-1; i++) {
                     var nextTask = userDayObject.tasks[i];
                     var taskSize = PieUtilities.taskSize(nextTask.start, nextTask.end);
                     nextTask.start = moment(nextTask.start).add(rippleDifferenceMs, 'ms').format();
                     nextTask.end = moment(nextTask.start).add(taskSize, 'minutes').format();
             }
         }

         if(rippleMethod == "start-push-pull"){
             for(var i = task.id-1; i > 0; i--){
                 var previousTask = userDayObject.tasks[i];
                 var taskSize = PieUtilities.taskSize(previousTask.start, previousTask.end);
                 var oldEnd = previousTask.end;
                 previousTask.end = moment(previousTask.end).add(rippleDifferenceMs, 'ms').format();
                 previousTask.start = moment(previousTask.end).subtract(taskSize, 'minutes').format();
             }
         }

        return _validateTaskListForDay(userDayObject.tasks);
    }

    function _taskListUpdateFailed() {
        console.log("task list update failed, restoring using cached data");
        eve("taskListUpdateFailed");
        userDayObject.tasks = self.__temp();
        _validateDay(userDayObject);
        eve("taskListUpdated");
    }

    function _taskListUpdated(_animate) {
        console.log("task list successfully updated, caching new validated data");
        self._taskListIsDirty = false;
        __temp = JSON.stringify(userDayObject.tasks);
        eve("taskListUpdated", {}, _animate);
    }

    self.__temp = function(){
        return JSON.parse(__temp)
    };


    self.addTask = function(task) {
        userDayObject.tasks.push(task);
        if(_validateDay(userDayObject)){
            _taskListUpdated();
            return true;
        }
    };

    self.getTask = function(taskIndex) {
        return userDayObject.tasks[taskIndex];
    };

    self.removeTask = function(){
    };

    self.updateTasks = function(_taskMap, _updateMethod, _animate) {

        self._taskListIsDirty = true;

        var clean = false;
        var animate = (_animate == null || _animate == false) ? false : ((_animate == true) ? true : null);
        var updateMethod = _updateMethod || "regular";
        var dirtyTasks = (!_taskMap || _taskMap == [] || _taskMap == "all") ? userDayObject.tasks : _taskMap.map(function(id){
            return userDayObject.tasks[id];
        });

        console.log("Updating Tasks "+updateMethod, dirtyTasks);

        if(updateMethod.includes("insert")){

            var taskA = dirtyTasks[0];
            var taskB = dirtyTasks[1];

            clean = _updateTasksByInsertAndRipple(taskA, taskB, updateMethod);
        }

        if(updateMethod.includes("push-pull")){
            clean = dirtyTasks.every(function(dirtyTask, index, array){
                return _updateTaskByPushPull(dirtyTask, updateMethod);
            });
        }

        if(updateMethod == "regular"){
            clean = _validateDay(userDayObject);
        }

        if(clean){
            _taskListUpdated(animate);
        }else{
            _taskListUpdateFailed();
        }

    };

    self.getTasks = function(){
        return userDayObject.tasks;
    };

    self.getTaskCount = function(){
        return userDayObject.tasks.length;
    };

    self.getSleepTasks = function (){
        return sleep;
    };

    self.getSleepGoalInMinutes = function(){
        return moment.duration(userDayObject.sleepGoal).asMinutes();
    };

    //sum of am and pm sleep minutes
    self.getSleepTimeInMinutes = function(){
        var sleep = self.getSleepTasks();
        var sumSleepTimeInMinutes = 0;

        sleep.forEach(function(e, i, a){
            sumSleepTimeInMinutes+=PieUtilities.taskSize(e.start, e.end);
        });

        return sumSleepTimeInMinutes;
    };

    self.taskListIsValid = function(){
      return self._taskListIsValid;
    };

    self.taskListIsDirty = function(){
        return self._taskListIsDirty;
    };

    utilities.taskIsValid = function(task) {
         var startingTime = moment(task.start);
         var terminalTime = moment(task.end);

         if(___taskWouldHappenOnTheWrongDay(startingTime, terminalTime)||
             ___taskWouldSpanSeveralDays(startingTime, terminalTime)||
             ___taskWouldEndBeforeItStarts(startingTime, terminalTime)||
             ___taskWouldOverlapNextTask(task, userDayObject.tasks)||
             ___taskWouldBeTooSmall(task)){

             console.log(task.name + " could not be validated");
             return false;
         }

        return true;
     };

    utilities.firstAvailableOpening = function(minutes){
        var canPlaceTask = false;
        var newStartingTime;

        userDayObject.tasks.every(function(task, index, array){

            var nextTask = array[index + 1];
            //console.log("looking at task "+task.name);

            if(nextTask){
                //console.log("and the task after that "+nextTask.name);
                var nextTaskStart = moment(nextTask.start);
                if(nextTaskStart.isAfter(moment(task.end).add(minutes, 'm'))){
                    //console.log("there is space after "+task.name);
                    canPlaceTask = true;
                    newStartingTime = task.end;
                    return false;
                }
            }else if(index == 0){
                //console.log("there is space immediatly after "+task.name);
                canPlaceTask = true;
                newStartingTime = task.end;
                return false;
            }

            return true;

        });

        if(canPlaceTask){
            console.log("space available");
            return newStartingTime;
        }else{
            return false;
        }


    };

    init(_dayDataObject);

}

/*
* I can imagine a version of this for
* teams.. a project manager assigns a task
* to someone for a particular day, and
* it will automatically reject if the pie
* calculates that you can't complete it
*
* at jawbone i liked the idea of points
* but it's too arbitrary.. it was like
* throwing a dart at the wall.. one was
* expected to guess how many "points"
* something was worth without regard to
* the day... was a point = time?
* difficulty ?
*
* i think the gem with this is
* the design will help you to think
* through the tasks you have so that you
* can better estimate how long it will
* take you... since the design changes
* as you allocate more time to an object
* you will be able to see how one
* task directly affects another
* its all about balance
*
* */