import { PiUtilities } from '../components/PiUtilities.js';
import { TaskSetController } from '../components/TaskManager.js';
import { TaskDonut } from '../components/TaskDonut.js';
import { TaskStrip } from '../components/TaskStrip/TaskStrip.js';
import { Day } from '../components/DayHelper.js';

export function MainController($scope, $timeout, $filter) {

    'ngInject';

    Number.prototype.mod = function (n) {
        return ((this % n) + n) % n;
    };

    Number.prototype.roundToTheNearest = function (i) {
        var i = i || 1;
        return Math.ceil(this / i) * i;
    };

    Math.TWOPI = 2 * Math.PI;

    var taskDonut,
        taskManager,
        taskStrip;

    var today = new Day();

    $scope.taskData = {
        day: today.string,
        wakeUpTime: today.at("7:30 am"),
        bedTime: today.nextDay().at("2:00 am"),
        sleepGoal: "08:00",
        tasks: [
            {
                name: "Work at the Studio",
                start: today.at("7:30 am"),
                end: today.at("1:30 pm"),
                emoji: '1f3c0.png',
                tempData: {}
            },
            {
                name: "Gym",
                start: today.at("3:00 pm"),
                end: today.at("4:00 pm"),
                color: '#7e3c46',
                emoji: '1f4d0.png',
                tempData: {}
            },
            {
                name: "Return rentals",
                start: today.at("4:00 pm"),
                end: today.at("5:00 pm"),
                emoji: '1f4de.png',
                tempData: {}
            },
            {
                name: "Finish Paper",
                start: today.at("8:00 pm"),
                end: today.at("11:30 pm"),
                emoji: '1f62d.png',
                tempData: {}
            }
        ]
    };

    taskManager = new TaskSetController($scope.taskData);
    taskDonut = new TaskDonut(Snap("#task-donut"), taskManager);
    taskStrip = new TaskStrip(Snap("#task-strip"), taskManager);

    $scope.selectedTask = null;
    $scope.selectedTaskDetail = {};

    eve.on("taskListUpdated", taskListUpdated);
    eve.on("taskBlockSelected", taskBlockSelected);
    eve.on("userClickedOutsideOfStrip", userClickedOutsideOfStrip);

    function taskListUpdated(){
        $timeout(function(){
            $scope.taskDataString = JSON.stringify($scope.taskData, null, 4);
            $scope.numberOfUserTasks = taskManager.getTaskCount();
        })
    }

    function taskBlockSelected(taskID){
        console.log("task block clicked");
        $timeout(function(){
            $scope.selectedTaskDetail = taskManager.getTask(taskID);
            $scope.showListView = true;
        });
    }

    function userClickedOutsideOfStrip(){
        $scope.$apply(function(){
            $scope.selectedTaskDetail = null;
            $scope.showListView = false;
        });
    }

    $scope.Utilities = PiUtilities;
    $scope.taskFilter = PiUtilities.task_data_filter;

    $scope.redraw = function(){
        eve("taskListUpdated");
    };

    $scope.selectTask = function (id) {
        $scope.selectedTaskDetail = taskManager.getTask(id);
        $scope.selectedTaskID = id;
        taskStrip.selectedTaskBlock(id);
    };

    $scope.deselectTasks = function () {
        $scope.selectedTaskDetail = null;
        $scope.selectedTaskID = null;
        console.log($scope.selectedTaskID);
    };

    $scope.createNewTask = function () {
        var firstAvailableTime = taskManager.utilities.firstAvailableOpening(taskManager.MINIMUM_TASK_SIZE, taskStrip.scale.min, taskStrip.scale.max);
        if(firstAvailableTime){
            var taskID = taskManager.addTask({
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
        var key = $scope.selectedTaskDetail.afterward;
        if (key) {
            var insertTaskFunction = "insert" + key + "Task";
            if (insertTaskFunction in $scope) {
                $scope[insertTaskFunction]();
            }
        } else {
            $scope.removeTaskAfter();
        }
    };

    $scope.$watch('selectedTaskDetail.emoji', function () {
        //var newEmoji = $scope.selectedTaskDetail.emoji;
        //if (newEmoji) {
            //taskDonut.redraw();
        //}
    });

    $scope.$watch('selectedTaskDetail.angleSize', function () {
        var newTimeAllotment = $scope.selectedTaskDetail.angleSize;
        if (newTimeAllotment) {
            var slice = $scope.taskDonuts[0].slices[$scope.selectedTaskID];
            slice.update({
                angleSize: newTimeAllotment
            });
            console.log("Angle " + newTimeAllotment + " Minutes: " + PiUtilities.toMinutes(newTimeAllotment));
        }
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

                taskManager.updateTasks([taskID], "end-ripple");
            });

        },

        stop: function (e, ui) {
            //console.log(ui.item.index(), t);
            //taskManager.updateTasks();
        }

    };
}
