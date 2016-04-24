export function routerConfig($stateProvider, $urlRouterProvider) {
    'ngInject';
    $stateProvider

        .state('tour', {
            url: '/tour',
            abstract: true,
            controller: 'TourController',
            templateUrl: 'app/tour/tour.html'
        })

        .state('tour.splash', {
            url: '',
            templateUrl: 'app/tour/splash/splash.html'
        })

        .state('tour.step_one', {
            url: '/you',
            templateUrl: 'app/tour/step_one/step_one.html'
        })

        .state('home', {
            url: '/main',
            templateUrl: 'app/main/main.html',
            controller: 'MainController',
            controllerAs: 'main'
        });

    $urlRouterProvider.otherwise('/tour');
}
