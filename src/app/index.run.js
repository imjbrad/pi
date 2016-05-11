export function runBlock ($rootScope, $log) {
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
    console.log("Moving to the next step in the tour");
    $rootScope.tourStep+=1;
  }

}
