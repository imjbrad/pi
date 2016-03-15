import { PieUtilities } from '../components/PiUtilities.js';
import { TaskSetController } from '../components/TaskManager.js';
import { TaskDonut } from '../components/TaskDonut.js';
import { TaskStrip } from '../components/TaskStrip/TaskStrip.js';

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

    $scope.taskData = {
        day: PieUtilities.today,
        sleepGoal: "08:30",
        tasks: [
            {
                name: "Work at the Studio",
                start: PieUtilities.todayAt("7:30 am"),
                end: PieUtilities.todayAt("1:30 pm"),
                emoji: '1f3c0.png',
                tempData: {}
            },
            {
                name: "Gym",
                start: PieUtilities.todayAt("3:00 pm"),
                end: PieUtilities.todayAt("4:00 pm"),
                color: '#7e3c46',
                emoji: '1f4d0.png',
                tempData: {}
            },
            {
                name: "Return rentals",
                start: PieUtilities.todayAt("4:00 pm"),
                end: PieUtilities.todayAt("5:00 pm"),
                emoji: '1f4de.png',
                tempData: {}
            },
            {
                name: "Finish Paper",
                start: PieUtilities.todayAt("8:00 pm"),
                end: PieUtilities.todayAt("11:30 pm"),
                emoji: '1f62d.png',
                tempData: {}
            },
            {
                name: "Sleep_B",
                start: PieUtilities.todayAt("11:30 pm"),
                end: PieUtilities.todayAt("11:59 pm"),
                color: '#7e3c46',
                type: 'sleep',
                tempData: {}
            },
            {
                name: "Sleep_A",
                start: PieUtilities.todayAt("12:00 am"),
                end: PieUtilities.todayAt("07:30 am"),
                type: "sleep",
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

    function taskListUpdated(){
        $scope.taskDataString = JSON.stringify($scope.taskData, null, 4);
        $scope.numberOfUserTasks = taskManager.getTaskCount();
    }

    $scope.Utilities = PieUtilities;
    $scope.taskFilter = PieUtilities.task_data_filter;

    $scope.redraw = function(){
        eve("taskListUpdated");
    };

    $scope.selectTask = function (i) {
        $scope.selectedTaskDetail = taskManager.getTask(i);
        $scope.selectedTaskIndex = i;
        console.log($scope.selectedTaskIndex);
    };

    $scope.selectLastTask = function () {
        $scope.selectTask(taskManager.getTaskCount() - 1);
    };

    $scope.deselectTasks = function () {
        $scope.selectedTaskDetail = null;
        $scope.selectedTaskIndex = null;
        console.log($scope.selectedTaskIndex);
    };

    $scope.createNewTask = function () {
        var firstAvailableTime = taskManager.utilities.firstAvailableOpening(15);
        if(firstAvailableTime){
            taskManager.addTask({
                name: $scope.newTaskName,
                start: firstAvailableTime,
                end: moment(firstAvailableTime).add(15, 'm').format(),
                color: "#9ec2e1"
            });
            $scope.newTaskName = "";
            $scope.selectLastTask();
        }
    };

    $scope.deleteCurrentlySelectedTask = function () {
        $scope.taskData.tasks.splice($scope.selectedTaskIndex, 1);
        if ($scope.taskData.tasks.length - 1 > 0) {
            $scope.selectTask($scope.taskData.tasks.length - 1);
        } else {
            $scope.deselectTasks();
        }
        $scope.taskDonuts[0].redraw();
    };

    function insertTaskAfterCurrentlySelectedTask(task) {
        var nextTaskIndex = $scope.selectedTaskIndex + 1;
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
        var nextTask = $scope.taskData.tasks[$scope.selectedTaskIndex + 1];
        if (nextTask && nextTask.insertedAfterward) {
            $scope.taskData.tasks.splice($scope.selectedTaskIndex + 1, 1);
            $scope.taskDonuts[0].redraw();
        }
        $scope.selectTask($scope.selectedTaskIndex);
    };

    $scope.insertBreakTask = function () {
        var newBreakTask = {
            name: '30 Minute Break',
            angleSize: PieUtilities.toAngleSize(30),
            color: PieUtilities.colors.night,
            type: 'break',
            insertedAfterward: true
        };
        insertTaskAfterCurrentlySelectedTask(newBreakTask);
    };

    $scope.insertEatTask = function () {
        var newEatTask = {
            name: 'Eat',
            angleSize: PieUtilities.toAngleSize(45),
            color: PieUtilities.colors.day,
            type: 'break',
            insertedAfterward: true
        };
        insertTaskAfterCurrentlySelectedTask(newEatTask);
    };

    $scope.insertExerciseTask = function () {
        var newExerciseTask = {
            name: 'Exercise',
            angleSize: PieUtilities.toAngleSize(45),
            color: PieUtilities.colors.day,
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
            var slice = $scope.taskDonuts[0].slices[$scope.selectedTaskIndex];
            slice.update({
                angleSize: newTimeAllotment
            });
            console.log("Angle " + newTimeAllotment + " Minutes: " + PieUtilities.toMinutes(newTimeAllotment));
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
                task.end = moment(task.start).add(PieUtilities.taskSize(_oldTaskStart, task.end), 'm').format();

                taskManager.updateTasks([taskID], "end-ripple");
            });

        },

        stop: function (e, ui) {
            //console.log(ui.item.index(), t);
            //taskManager.updateTasks();
        }

    };
}
