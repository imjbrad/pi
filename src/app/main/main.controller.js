import { PieUtilities } from '../components/TaskDonutUtilities.js';

export function MainController ($scope, $timeout, $filter) {

    'ngInject';

      Number.prototype.mod = function(n) {
        return ((this%n)+n)%n;
      };

      var _toRad = function(deg){
        return deg * Math.PI / 180;
      };


      $scope.selectedTask = null;

      $scope.selectedTaskDetail = {};

      $scope.taskDonuts = [];
      $scope.taskDonut = $scope.taskDonuts[0];

      $scope.taskData = {
        tasks: [

        ]
      };

      $scope.Utilities = PieUtilities;

      $scope.taskFilter = function(task, index, array){
        return (task.taskType && task.taskType == "standardSleep") ? false : true;
      };

      $scope.selectTask = function(i){
        $scope.selectedTaskDetail = $scope.taskData.tasks[i];
        $scope.selectedTaskIndex = i;
        console.log($scope.selectedTaskIndex);
      };

      $scope.selectLastTask = function(){
        $scope.selectTask($scope.taskData.tasks.length-1);
      };

      $scope.deselectTasks = function(){
        $scope.selectedTaskDetail = null;
        $scope.selectedTaskIndex = null;
        console.log($scope.selectedTaskIndex);
      };

      $scope.createNewTask = function(){
        var newTask = {
          name: $scope.newTaskName,
          angleSize: PieUtilities.toAngleSize(15),
          color: "#9ec2e1"
        };
        $scope.taskData.tasks.push(newTask);
        $scope.newTaskName = "";
        $scope.selectLastTask();
        $scope.taskDonuts[0].redraw();
      };

      $scope.deleteCurrentlySelectedTask = function(){
        $scope.taskData.tasks.splice($scope.selectedTaskIndex, 1);
        if($scope.taskData.tasks.length - 1 > 0){
          $scope.selectTask($scope.taskData.tasks.length - 1);
        }else{
          $scope.deselectTasks();
        }
        $scope.taskDonuts[0].redraw();
      };

      function insertTaskAfterCurrentlySelectedTask(task){
        var nextTaskIndex = $scope.selectedTaskIndex+1;
        var nextTask = $scope.taskData.tasks[nextTaskIndex];
        if(nextTask){
          console.log("next: "+nextTask.name);
          if(nextTask.insertedAfterward){
            $scope.taskData.tasks.splice(nextTaskIndex, 1, task);
          }else{
            $scope.taskData.tasks.splice(nextTaskIndex, 0, task);
          }
        }else{
          $scope.taskData.tasks.push(task);
        }

        $scope.taskDonuts[0].redraw();
      }

      $scope.removeTaskAfter = function(){
        var nextTask = $scope.taskData.tasks[$scope.selectedTaskIndex+1];
        if(nextTask && nextTask.insertedAfterward){
          $scope.taskData.tasks.splice($scope.selectedTaskIndex+1, 1);
          $scope.taskDonuts[0].redraw();
        }
        $scope.selectTask($scope.selectedTaskIndex);
      };

      $scope.insertBreakTask = function(){
        var newBreakTask = {
          name: '30 Minute Break',
          angleSize: PieUtilities.toAngleSize(30),
          color: PieUtilities.colors.night,
          taskType: 'standardBreak',
          insertedAfterward: true
        };
        insertTaskAfterCurrentlySelectedTask(newBreakTask);
      };

      $scope.insertEatTask = function(){
        var newEatTask = {
          name: 'Eat',
          angleSize: PieUtilities.toAngleSize(45),
          color: PieUtilities.colors.day,
          taskType: 'standardBreak',
          insertedAfterward: true
        };
        insertTaskAfterCurrentlySelectedTask(newEatTask);
      };

      $scope.insertExerciseTask = function(){
        var newExerciseTask = {
          name: 'Exercise',
          angleSize: PieUtilities.toAngleSize(45),
          color: PieUtilities.colors.day,
          insertedAfterward: true
        };
        insertTaskAfterCurrentlySelectedTask(newExerciseTask);
      };

      $scope.toggleListView = function(){
        $scope.showListView = !$scope.showListView;
        console.log("List View: "+$scope.showListView);
      };

      $scope.selectTaskAfter = function(){
        var key = $scope.selectedTaskDetail.afterward;
        if(key){
          var insertTaskFunction = "insert"+key+"Task";
          if(insertTaskFunction in $scope){
            $scope[insertTaskFunction]();
          }
        }else{
          $scope.removeTaskAfter();
        }
      };

      $scope.$watch('selectedTaskDetail.emoji', function() {
        var newEmoji = $scope.selectedTaskDetail.emoji;
        if(newEmoji){
          $scope.taskDonuts[0].redraw();
        }
      });

      $scope.$watch('selectedTaskDetail.angleSize', function() {
        var newTimeAllotment = $scope.selectedTaskDetail.angleSize;
        if(newTimeAllotment){
          var slice = $scope.taskDonuts[0].slices[$scope.selectedTaskIndex];
          slice.update({
            localAngle: newTimeAllotment,
            terminalAngle: slice.calculateDrawingAngles(newTimeAllotment).terminalAngle
          });
          console.log("Angle "+newTimeAllotment+" Minutes: "+PieUtilities.toMinutes(newTimeAllotment));
        }
      });

      $scope.$watch('taskData', function(){
        $scope.taskDataString = JSON.stringify($scope.taskData, null, 4);
      }, true);

      $scope.sortableOptions = {

        start: function(){
        },

        update: function(event) {
          $timeout(function () {
            //$scope.taskDonuts[0].redraw();
          })
        },

        out: function(){
          $timeout(function () {
            //$scope.taskDonuts[0].bucket_ring.show();
          })
        },

        over: function(){
          $timeout(function () {
          })
        },

        stop: function(){
          $timeout(function () {
            $scope.taskDonuts[0].bucket_ring.hide();
          })
        }

      };
}
