export function routerConfig($stateProvider, $urlRouterProvider, $locationProvider) {
    'ngInject';

    $stateProvider

        .state('tour', {
            url: '/tour',
            abstract: true,
            templateUrl: 'app/tour/tour.html'
        })

        .state('tour.step_one', {
            url: '',
            templateUrl: 'app/tour/step_one/step_one.html',
            controller: 'TourStepOneController'
        })

        .state('tour.step_one.photo', {
            url: '/you'
        })

        .state('home', {
            url: '/main',
            templateUrl: 'app/main/main.html',
            controller: 'MainController',
            controllerAs: 'main'
        });

    //instagram router
    $urlRouterProvider.rule(function ($injector, $location) {
        var fullPath = window.location.href.split(window.location.origin)[1];
        if(fullPath.includes("/instagram")){
            var everythingAfter = fullPath.split("/instagram")[1];
            //hacky
            everythingAfter = everythingAfter.replace("#/access_token", "?access_token");
            window.location = window.location.origin + "/#/tour/you" + everythingAfter;
        }
    });

    $urlRouterProvider.otherwise('/tour');



}
