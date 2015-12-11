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

      $scope.selectTask = function(i){
        $scope.selectedTaskDetail = $scope.taskData.tasks[i];
        $scope.selectedTaskIndex = i;
      };

      $scope.taskFilter = function(task, index, array){
        return (task.taskType && task.taskType == "standardSleep") ? false : true;
      };

      $scope.createNewTask = function(){

        var newTask = {
          name: $scope.newTaskName,
          angleSize: 20,
          color: "#f97340"
        };

        $scope.taskData.tasks.push(newTask);
        $scope.newTaskName = "";
        $scope.selectTask($scope.taskData.tasks.length-1);
        $scope.taskDonuts[0].redraw();
      };

      $scope.toggleListView = function(){
        $scope.showListView = !$scope.showListView;
        console.log("List View: "+$scope.showListView);
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
            $scope.taskDonuts[0].redraw();
          })
        },

        out: function(){
          $timeout(function () {
            $scope.taskDonuts[0].bucket_ring.show();
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
