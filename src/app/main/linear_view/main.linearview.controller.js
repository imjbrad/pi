import { PiUtilities } from '../../components/PiUtilities.js';
import { TaskManager } from '../../components/TaskManager.js';
import { TaskDonut } from '../../components/TaskDonut/TaskDonut.js';
import { TaskStrip } from '../../components/TaskStrip/TaskStrip.js';
import { Day } from '../../components/DayHelper.js';

export function LinearViewController($scope, $timeout, $rootScope) {

    'ngInject';

    var taskStrip;

    $scope.taskManager = new TaskManager($rootScope.taskData);

    taskStrip = new TaskStrip(Snap("#task-strip"), $scope.taskManager);

    $scope.selectedTask = {};
    $scope.currentDetailView = "basic-details";

    eve.on("taskListUpdated", taskListUpdated);
    eve.on("taskBlockSelected", taskBlockSelected);
    eve.on("userClickedOutsideOfStrip", userClickedOutsideOfStrip);
    eve.on("userAddedTaskByClickingStrip", userAddedTaskByClickingStrip);
    eve.on("userIsDraggingTask", userIsDraggingTask);

    function taskListUpdated(){
        $timeout(function(){
            $scope.taskDataString = JSON.stringify($scope.taskData, null, 4);
            $scope.numberOfUserTasks = $scope.taskManager.getTaskCount();
        })
    }

    function taskBlockSelected(taskID){
        $timeout(function(){
            $scope.selectedTask = $scope.taskManager.getTask(taskID);
        });
    }

    function userClickedOutsideOfStrip(){
    }

    function userAddedTaskByClickingStrip(id){
        console.log(id);
        $timeout(function(){
            $scope.selectTask(id);
            if($rootScope.tourInProgress && $rootScope.tourStep == 4){
                $rootScope.advanceTour();
            }
        });
    }

    function userIsDraggingTask(){
        $timeout(function(){
            if($rootScope.tourInProgress && $rootScope.tourStep == 6){
                $rootScope.advanceTour();
            }
        });
    }

    $scope.Utilities = PiUtilities;
    $scope.taskFilter = PiUtilities.task_data_filter;

    $scope.toLinearSize = function(minutes){
        return PiUtilities.toLinearSizeFromTaskSize(minutes, taskStrip.scale.min, taskStrip.scale.max)
    };

    $scope.redraw = function(){
        eve("taskListUpdated");
    };

    $scope.selectTask = function (idOrIndex) {

        if(typeof idOrIndex == "number")
            $scope.selectedTask = $scope.taskManager.getTaskAtIndex(idOrIndex);

        if(typeof idOrIndex == "string")
            $scope.selectedTask = $scope.taskManager.getTask(idOrIndex);

        $scope.selectedTaskID = $scope.selectedTask.id;
        taskStrip.selectedTaskBlock($scope.selectedTaskID);

    };

    $scope.deselectTasks = function () {
        $scope.selectedTask = null;
        $scope.selectedTaskID = null;
        console.log($scope.selectedTaskID);
    };

    $scope.createNewTask = function () {
        var firstAvailableTime = $scope.taskManager.utilities.firstAvailableOpening($scope.taskManager.MINIMUM_TASK_SIZE, taskStrip.scale.min, taskStrip.scale.max);
        if(firstAvailableTime){
            var taskID = $scope.taskManager.addTask({
                name: $scope.newTaskName,
                start: firstAvailableTime,
                end: moment(firstAvailableTime).add(15, 'm').format(),
                color: "#9ec2e1"
            });
            $scope.newTaskName = "";
            $scope.selectTask(taskID);
        }
    };

    $scope.deleteCurrentlySelectedTask = function () {
        $scope.taskData.tasks.splice($scope.selectedTaskID, 1);
        if ($scope.taskData.tasks.length - 1 > 0) {
            $scope.selectTask($scope.taskData.tasks.length - 1);
        } else {
            $scope.deselectTasks();
        }
        $scope.taskDonuts[0].redraw();
    };


    function insertTaskAfterCurrentlySelectedTask(task) {
        var nextTaskIndex = $scope.selectedTaskID + 1;
        var nextTask = $scope.taskData.tasks[nextTaskIndex];
        if (nextTask) {
            console.log("next: " + nextTask.name);
            if (nextTask.insertedAfterward) {
                $scope.taskData.tasks.splice(nextTaskIndex, 1, task);
            } else {
                $scope.taskData.tasks.splice(nextTaskIndex, 0, task);
            }
        } else {
            $scope.taskData.tasks.push(task);
        }

        $scope.taskDonuts[0].redraw();
    }

    $scope.removeTaskAfter = function () {
        var nextTask = $scope.taskData.tasks[$scope.selectedTaskID + 1];
        if (nextTask && nextTask.insertedAfterward) {
            $scope.taskData.tasks.splice($scope.selectedTaskID + 1, 1);
            $scope.taskDonuts[0].redraw();
        }
        $scope.selectTask($scope.selectedTaskID);
    };

    $scope.insertBreakTask = function () {
        var newBreakTask = {
            name: '30 Minute Break',
            angleSize: PiUtilities.toAngleSize(30),
            color: PiUtilities.colors.night,
            type: 'break',
            insertedAfterward: true
        };
        insertTaskAfterCurrentlySelectedTask(newBreakTask);
    };

    $scope.insertEatTask = function () {
        var newEatTask = {
            name: 'Eat',
            angleSize: PiUtilities.toAngleSize(45),
            color: PiUtilities.colors.day,
            type: 'break',
            insertedAfterward: true
        };
        insertTaskAfterCurrentlySelectedTask(newEatTask);
    };

    $scope.insertExerciseTask = function () {
        var newExerciseTask = {
            name: 'Exercise',
            angleSize: PiUtilities.toAngleSize(45),
            color: PiUtilities.colors.day,
            insertedAfterward: true
        };
        insertTaskAfterCurrentlySelectedTask(newExerciseTask);
    };

    $scope.toggleListView = function () {
        $scope.showListView = !$scope.showListView;
        console.log("List View: " + $scope.showListView);
    };

    $scope.selectTaskAfter = function () {
        var key = $scope.selectedTask.afterward;
        if (key) {
            var insertTaskFunction = "insert" + key + "Task";
            if (insertTaskFunction in $scope) {
                $scope[insertTaskFunction]();
            }
        } else {
            $scope.removeTaskAfter();
        }
    };

    $scope.$watch('selectedTask.emoji', function () {
        var newEmoji = $scope.selectedTask.emoji;
        if (newEmoji) {
            $scope.taskManager.updateTasks();
        }
    });

    $scope.$watch('selectedTask.tempData.allotment', function () {
        var newTimeAllotment = $scope.selectedTask.tempData.allotment;

        $scope.selectedTask.end = moment($scope.selectedTask.start).add(newTimeAllotment, 'm').format();
        $scope.taskManager.updateTasks();

        console.log(newTimeAllotment);
    });

    var prevIndex;

    $scope.sortableOptions = {
        cancel: 'input',
        start: function (e, ui) {
            prevIndex = ui.item.index();
        },

        update: function (event, ui) {

            $timeout(function(){
                var taskID = parseInt($(ui.item).attr('data-task-id'));
                var swapID = parseInt($('.task-li[data-index='+prevIndex+']').attr('data-task-id'));

                prevIndex = null;

                var task = $scope.taskData.tasks[taskID],
                    _oldTaskStart = task.start;

                var swap = $scope.taskData.tasks[swapID];

                task.start = swap.start;
                task.end = moment(task.start).add(PiUtilities.taskSize(_oldTaskStart, task.end), 'm').format();

                $scope.taskManager.updateTasks([taskID], "end-ripple");
            });

        },

        stop: function (e, ui) {
            //console.log(ui.item.index(), t);
            //$scope.taskManager.updateTasks();
        }

    };

    //init
    $scope.selectTask(1);
    $scope.showListView = true;
}
