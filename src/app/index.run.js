export function runBlock ($rootScope, $log) {
  'ngInject';
  $log.debug('runBlock end');

  $rootScope.demo_user_settings = {

  };

  $rootScope.$on("$stateChangeSuccess", function(e, to){
    $rootScope.currentState = to.name;
    console.log($rootScope.currentState)
  })

}
