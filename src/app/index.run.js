export function runBlock ($rootScope, $log, $timeout, $location) {
  'ngInject';
  $log.debug('runBlock end');

  $rootScope.demo_user_settings = {

  };

  $rootScope.$on("$stateChangeSuccess", function(e, to){
    $rootScope.currentState = to.name;
    console.log($rootScope.currentState)
  });

  $rootScope.tourStep = 0;

  $rootScope.tourInProgress = true;

  $rootScope.advanceTour = function(){
    $rootScope.tourStep+=1;
    console.log("Tour", $rootScope.tourStep);
  };

  $rootScope.resetTour = function(){
    $rootScope.tourStep = 0;
    $rootScope.tourInProgress = true;
    $location.path('/main');
  };


  var sessionLengthInMinutes = 1,
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

  $(document).on('mousemove keypress', function(){
    console.log("renewing session, resetting timer");
    resetSessionTimer();
  });

  setSessionTimer();

}
