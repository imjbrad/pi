export function MainController ($scope, $timeout, $filter) {

    'ngInject';

      Number.prototype.mod = function(n) {
        return ((this%n)+n)%n;
      };

      var _toRad = function(deg){
        return deg * Math.PI / 180;
      };

      $scope.selectedEmoji = null;
      $scope.selectedTask = null;
      $scope.showListView = false;

      $scope.taskDonuts = [];

      $scope.taskData = {
        info: {
          type: "day"
        },
        tasks: [

        ]
      };

      $scope.selectTask = function(i){
        $scope.selectedTask = $scope.taskData.tasks[i];
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

      function _setMultiDayView() {

      }

      function _setSingleDayView(){
        console.log("setting single-day-view")
      }

      $scope.setView = function(view) {
        $scope.view = view;
        if($scope.view == "multi-day-view"){
          _setMultiDayView();
        }
        if($scope.view == "single-day-view"){
          _setSingleDayView();
        }
      };

      $scope.$watch('selectedEmoji', function() {
        console.log($scope.selectedEmoji);
        if($scope.selectedTask){
          $scope.taskData.tasks[$scope.selectedTaskIndex].emoji =  $scope.selectedEmoji;
          $scope.taskDonuts[0].redraw();
        }
      });

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
