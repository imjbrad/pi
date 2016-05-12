import { TaskDonut } from './TaskDonut.js';
import { TaskManager } from '../TaskManager';

export function TaskDonutDirective($state, $timeout, $rootScope){

  'ngInject';

  return{
    restrict: 'E',
    scope: {
      taskDonutModel: "=",
      taskDonutManager: "=",
      showCamera:'='
    },

    templateUrl:'app/components/TaskDonut/TaskDonutDirective.html',
    link: function($scope, el, attr){

      var donutSVG = el.find("svg.donut")[0];
      console.log(donutSVG);
      console.log($scope.taskDonutManager);
      $scope.taskDonutModel = new TaskDonut(Snap(donutSVG), $scope.taskDonutManager);

      var donut = $(".TaskDonut", this);

        el.mousedown(function(){
          if($rootScope.tourInProgress && $rootScope.tourStep < 4)
            return false;
          donut.addClass("push-donut");
        });

        el.click(function(){
          if($rootScope.tourInProgress && $rootScope.tourStep < 4)
            return false;

          var wait = 0;
          donut.addClass("push-donut");

          wait+=300;
          $timeout(function(){donut.removeClass("push-donut");}, wait);

          wait+=100;
          $timeout(function(){$state.go($scope.stateLink || attr.stateLink || 'home.linear')}, wait);

        });

      var redirectURL = window.location.origin + "main/instagram";

      $scope.instagramPhotoIndex = 0;
      $scope.images = [];

      $scope.photoOption = null;
      $scope.settings = $rootScope.demo_user_settings;
      $scope.instagram_auth_url = "https://api.instagram.com/oauth/authorize/?client_id=823677c4bf4544f6a90daf2b6134b0c3&redirect_uri="+redirectURL+"&response_type=token";

      $scope.hideSplash = function(){
        $scope.splash = false;
      };

      $scope.selectInstagram = function(){
        window.location = $scope.instagram_auth_url;
      };

      $scope.skip = function() {
        $scope.setPhoto();
      };

      $scope.selectWebcam = function(){
        $scope.photoOption = "webcam";
      };

      $scope.$watch("demoTaskDonut", function(){
        console.log($scope.demoTaskDonut);
      });

      $scope.setPhoto = function(){

        var picture;

        if($scope.photoOption == "instagram"){
          picture = getPhotoAtIndex($scope.instagramPhotoIndex);
        }

        if($scope.photoOption == "webcam"){

          Webcam.snap( function(data_uri) {
            picture = data_uri;
          });

        }

        $scope.photoOption = null;
        $scope.showCamera = false;
        $scope.taskDonutManager.picture(picture);
        $scope.taskDonutModel.redraw();

        if($rootScope.tourInProgress) {
          $rootScope.advanceTour();
        }

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

      if($state.current.name == "tour_step_one"){
        $scope.handleInstagramAuth();
      }

    }

  }

}
