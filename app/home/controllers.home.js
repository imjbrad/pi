'use strict';

angular.module('app.controllers.home', ["ui.sortable"])

    .controller('HomeController', function ($scope, $timeout, $filter) {

        var week,
            privateTasks = [];

        Number.prototype.mod = function(n) {
            return ((this%n)+n)%n;
        };

        var _toRad = function(deg){
            return deg * Math.PI / 180;
        };

        $scope.taskDonuts = [];

        $scope.redrawDonuts = function(){
            $scope.taskDonuts.forEach(function(donut, index, array){
                donut.updateTasks($scope.taskData.tasks);
            });
        };

        $scope.taskData = {
            info: {
                type: "day"
            },
            tasks: [

                {
                    name: "Build church project home page",
                    angleSize: Math.floor(Math.random() * (60 - 20 + 1)) + 20,
                    color: "#f9b978"
                },
                {
                    name: "Polish cirque app screens",
                    angleSize: Math.floor(Math.random() * (60 - 20 + 1)) + 20,
                    color: "#f97340"
                },
                {
                    name: "Read african american history book",
                    angleSize: Math.floor(Math.random() * (60 - 20 + 1)) + 20,
                    color: "#f9b978"
                },
                {
                    name: "Eat Breakfast",
                    angleSize: Math.floor(Math.random() * (60 - 20 + 1)) + 20,
                    color: "#f97340"
                }
            ]
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

            $scope.tasks.push(newTask);
            $scope.newTaskName = "";
        };

        function _setMultiDayView() {

            $scope.littleDays = $filter('filter')($scope.taskDonuts, function(donut, index, array){
                return donut.index >= 1 && donut.index <= 6
            });

            $scope.littleDays.forEach(function(donut, index, array){
                donut.setCoverText(donut.tag);
            });

            console.log("setting multi-day-view")
        }

        function _setSingleDayView(){}

        $scope.setView = function(view) {
            $scope.view = view;
            if($scope.view == "multi-day-view"){
                _setMultiDayView();
            }
            if($scope.view == "single-day-view"){
                _setSingleDayView();
            }
        };

        $timeout(function(){
            $scope.setView("multi-day-view");
        });

        $scope.sortableOptions = {
            update: function(event) {
                $timeout(function () {
                    $scope.redrawDonuts();
                })
            },

            out: function(){
                $timeout(function () {
                    //$scope.view = "multi-day-view";
                    $scope.setView("multi-day-view");

                })
            },

            over: function(){
                $timeout(function () {
                    $scope.view = "single-day-view"
                })
            },

            stop: function(){
                $timeout(function () {
                    $scope.view = "single-day-view"
                })
            }

        };

    })

    .directive('taskDonut', function(){
       return{
           restrict: 'E',
           replace: true,
           template:'<svg viewBox="0 0 200 200" class="TaskDonut"></svg>',
           link: function($scope, el, attr){
               var newDonut = new TaskDonut(Snap(el[0]), $scope.taskData.tasks);

               newDonut.onupdated(function(){
                   $scope.$apply();
               });

               newDonut.setIndex(parseInt(attr.index));
               newDonut.setTag(attr.tag);

               $scope.taskDonuts.push(newDonut);
           }
       }
    });