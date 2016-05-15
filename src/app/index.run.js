import { Day } from './components/DayHelper.js';


export function runBlock ($rootScope, $log, $timeout, $window) {
  'ngInject';

  //Fake Data
  var today = new Day();
  var random = Math.random();

  $rootScope.taskData = {
    picture: random < .5 ? "assets/terron.jpg" : "assets/faridah.jpg",
    wakeUpTime: today.at("7:30 am"),
    bedTime: today.nextDay().at("2:00 am"),
    sleepGoal: "08:00",
    tasks: [
      {
        name: "Gym",
        start: today.at("3:00 pm"),
        end: today.at("4:00 pm"),
        color: '#7e3c46',
        emoji: '1f4d0.png',
        description: '',
        tempData: {}
      },
      {
        name: "Return rentals",
        start: today.at("4:00 pm"),
        end: today.at("5:00 pm"),
        emoji: '1f4de.png',
        description: '',
        tempData: {}
      },
      {
        name: "Finish Paper",
        start: today.at("8:00 pm"),
        end: today.at("11:30 pm"),
        emoji: '1f62d.png',
        description: '',
        tempData: {}
      }
    ]
  };

  //State utility
  $rootScope.$on("$stateChangeSuccess", function(e, to){
    $rootScope.currentState = to.name;
    console.log($rootScope.currentState)
  });

  //Tour Control

  var origin = $window.location.origin,
      isOnGitHub = origin.indexOf("github") != -1,
      piPath = isOnGitHub ? "/pi/#/main" : "/#/main",
      resetPage = origin + piPath;

  $rootScope.tourStep = 0;

  $rootScope.tourInProgress = true;

  $rootScope.advanceTour = function(){
    $rootScope.tourStep+=1;
    console.log("Tour", $rootScope.tourStep);
  };

  $rootScope.resetTour = function(){
    console.log("Resetting tour");
    $rootScope.tourStep = 0;
    $rootScope.tourInProgress = true;

    if($window.location.href == resetPage){
      console.log("already on the home page, refreshing");
      $window.location.reload(true);
    }else{
      console.log("returning to home page");
      $window.location.href = resetPage;
    }

  };

  //Session Control
  var sessionLengthInMinutes = 1.5,
  userActiveTimer;

  //tour timeout
  function setSessionTimer(){
    console.log("setting timer");
    userActiveTimer = $timeout(function(){
      $rootScope.resetTour();
    }, sessionLengthInMinutes * 60000);
  }

  function resetSessionTimer(){
    $timeout.cancel(userActiveTimer);
    userActiveTimer = null;
    setSessionTimer();
  }

  //initialize the tour on live site
  if(isOnGitHub){
    console.log("initializing session timer");
    $(document).on('mousemove keypress', function(){
      resetSessionTimer();
    });
    setSessionTimer();
  }else{
    console.log("not initializing session timer")
  }

  $log.debug('runBlock end');

}
