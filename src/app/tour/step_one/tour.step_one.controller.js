/**
 * Created by jordanbradley on 4/23/16.
 */
import { TaskManager } from "../../components/TaskManager";
import { TaskDonut } from "../../components/TaskDonut/TaskDonut";
import { Day } from "../../components/DayHelper";

export function TourStepOneController($rootScope, $scope, $timeout, $state, $location, $http) {
    'ngInject';

    var today = new Day();

    $scope.splash = true;
    $scope.instagramPhotoIndex = 0;
    $scope.images = [];

    $scope.photoOption = null;
    $scope.settings = $rootScope.demo_user_settings;
    $scope.instagram_auth_url = "https://api.instagram.com/oauth/authorize/?client_id=823677c4bf4544f6a90daf2b6134b0c3&redirect_uri="+encodeURIComponent("http://localhost:3000/instagram")+"&response_type=token";

    $scope.taskData = {
        day: today.string,
        wakeUpTime: today.at("7:30 am"),
        bedTime: today.nextDay().at("2:00 am"),
        sleepGoal: "08:00",
        tasks: []
    };

    $scope.taskManager = new TaskManager($scope.taskData);
    $scope.demoTaskDonut = new TaskDonut(Snap("#donut"), $scope.taskManager);

    $scope.hideSplash = function(){
        $scope.splash = false;
    };

    $scope.selectInstagram = function(){
      window.location = $scope.instagram_auth_url;
    };

    $scope.selectWebcam = function(){
        $scope.photoOption = "webcam";
    };

    $scope.$watch("demoTaskDonut", function(){
       console.log($scope.demoTaskDonut);
    });

    $scope.setPhoto = function(){

        if($scope.photoOption == "instagram"){
            $rootScope.demo_user_settings.profile_picture = getPhotoAtIndex($scope.instagramPhotoIndex);
        }

        if($scope.photoOption == "webcam"){
            Webcam.snap( function(data_uri) {
                $rootScope.demo_user_settings.profile_picture = data_uri;
            });
        }

        $scope.photoOption = null;
        $scope.demoTaskDonut.setPhoto($rootScope.demo_user_settings.profile_picture);

    };

    function getPhotos(){
        $http.jsonp("https://api.instagram.com/v1/users/self/media/recent/?access_token="+$rootScope.instagram_access_token+"&callback=JSON_CALLBACK")
        .success(function(data){

            $scope.images = data.data.filter(function(instagramObject){
                return (instagramObject.type == "image")
            });

            $scope.currentInstagramImage = getPhotoAtIndex($scope.instagramPhotoIndex);

        })
    }

    function getPhotoAtIndex(i) {
        return $scope.images[i].images.standard_resolution.url;
    }

    $scope.shouldShowPrev = function(){
      return $scope.instagramPhotoIndex > 0;
    };

    $scope.shouldShowNext = function(){
        return $scope.instagramPhotoIndex < $scope.images.length-1;
    };

    $scope.nextInstagramImage = function() {
        if(!$scope.shouldShowNext())
            return;
        $scope.instagramPhotoIndex+=1;
        $scope.currentInstagramImage = getPhotoAtIndex($scope.instagramPhotoIndex);
    };

    $scope.prevInstagramImage = function() {
        if(!$scope.shouldShowPrev())
            return;
        $scope.instagramPhotoIndex-=1;
        $scope.currentInstagramImage = getPhotoAtIndex($scope.instagramPhotoIndex);
    };

    $scope.handleInstagramAuth = function(){
        var search = $location.search();

        if(search.access_token){
            $scope.photoOption = "instagram";
            $rootScope.instagram_access_token = search.access_token;
            getPhotos();
        }

        else if(search.error_description){console.log("Instagram Error")}
    };

    if($state.current.name == "tour.step_one.photo"){
        $scope.handleInstagramAuth();
    }

}

export function AttachWebcamDirective(){
    return{
        restrict: 'A',
        link: function(scope, el, attr){

            var camera = $("#camera"),
                height = camera.height(),
                width = 240;

            Webcam.set({
                // live preview size
                width: 320,
                height: 240,

                // device capture size
                dest_width: 640,
                dest_height: 480,

                // final cropped size
                crop_width: 480,
                crop_height: 480,

                // format and quality
                image_format: 'jpeg',
                jpeg_quality: 90
            });

            Webcam.attach(el[0].id);

        }
    }
}