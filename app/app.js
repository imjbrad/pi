'use strict';

// Declare app level module which depends on views, and components
angular.module('app', [
  'ui.router',
  'app.controllers.home'
])

.config(function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise("");

  $stateProvider
      .state('home', {
        url: "",
        templateUrl: "home/views.home.tpl.html"
      })
});
