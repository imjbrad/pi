import { PieUtilities } from './TaskDonutUtilities.js';

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

    function ___taskWouldOverlapNextTask(task, taskList, _nextID){
        var index = task.id,
            last = taskList.length - 1,
            nextIndex = _nextID ? _nextID : ((index == last) ? 0 : index + 1),
            nextTask = taskList[nextIndex],
            nextStartTime = moment(nextTask.start),
            terminalTime = moment(task.end);

        if(index < last && (nextStartTime.isBefore(terminalTime))){
            console.log("Task can't overlap next task: "+nextTask.name);
            return true;
        }

        return false;
    }

    function ___taskWouldBeTooSmall(task){
        var MINIMUM = 5;
        var taskSize = PieUtilities.taskSize(task.start, task.end);
        if(taskSize < MINIMUM){
            console.log("Task can't be too smaller than "+MINIMUM+" minimum");
            return true;
        }
        return false
    }

    function __taskWouldCauseOverlap(_task, _taskList){
        var task = _task,
            taskList = _taskList,
            startingTime = moment(task.start),
            terminalTime = moment(task.end);

        console.log("Validating: "+task.name);

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


        list = list.sort(function(taskA, taskB){
            return moment(taskA.start).isAfter(moment(taskB.start));
        });

        list.every(function(_task, _taskIndex, _taskList){
            valid = _validateTask(_task, _taskIndex, list);
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

    /*
    * Similar to a ripple edit in Premiere
    * when you change the size of one task,
    * it shifts all the other tasks earlier
    * or later, accordingly
    * */
     function _updateTaskByRipple(_dirtyTask, rippleMethod){

        var task = _dirtyTask,
            startingTime = moment(task.start),
            terminalTime = moment(task.end);

        console.log("starting ripple at "+PieUtilities.toAngle(task.end));

        var rippleHandle = rippleMethod.split('-')[0];

         var prevHandle = moment(task.tempData['prev-'+rippleHandle]);
         var newHandle = moment(task[rippleHandle]);

         var rippleDifferenceMs = newHandle.diff(prevHandle);

         if(rippleMethod == "end-ripple"){
             for(var i = task.id+1; i < userDayObject.tasks.length-1; i++) {
                     var nextTask = userDayObject.tasks[i];
                     var taskSize = PieUtilities.taskSize(nextTask.start, nextTask.end);
                     nextTask.start = moment(nextTask.start).add(rippleDifferenceMs, 'ms').format();
                     nextTask.end = moment(nextTask.start).add(taskSize, 'minutes').format();
             }
         }

         if(rippleMethod == "start-ripple"){
             for(var i = task.id-1; i > 0; i--){
                 var previousTask = userDayObject.tasks[i];
                 var taskSize = PieUtilities.taskSize(previousTask.start, previousTask.end);
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

    function _taskListUpdated() {
        console.log("task list successfully updated, caching new validated data");
        self._taskListIsDirty = false;
        __temp = JSON.stringify(userDayObject.tasks);
        eve("taskListUpdated");
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

    self.updateTasks = function(_taskMap, _updateMethod) {

        self._taskListIsDirty = true;

        var clean = false;
        var updateMethod = _updateMethod || "regular";
        var dirtyTasks = (!_taskMap || _taskMap == [] || _taskMap == "all") ? userDayObject.tasks : _taskMap.map(function(id){
            return userDayObject.tasks[id];
        });

        console.log("Updating Tasks "+updateMethod, dirtyTasks);

        if(updateMethod.includes("ripple")){
            clean = dirtyTasks.every(function(dirtyTask, index, array){
                return _updateTaskByRipple(dirtyTask, updateMethod);
            });
        }

        if(updateMethod == "regular"){
            clean = _validateDay(userDayObject);
        }

        if(clean){
            _taskListUpdated();
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

    self.getSleep = function(){
        return sleep;
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
            newStartingTime = moment(task.end);

            if(nextTask){
                var nextStartingTime = moment(nextTask.start);
                if(nextStartingTime.isAfter(moment(newStartingTime).add(minutes, 'm'))) {
                    console.log("space available after "+task.name);
                    canPlaceTask  = true;
                    return false;
                }
            }else{
                console.log("no next slice, space available immediatly after "+task.name);
                canPlaceTask = true;
                return false;
            }

        });

        if(canPlaceTask){
            console.log("space available");
            return newStartingTime.format();
        }

        return false;

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