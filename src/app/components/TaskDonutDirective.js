import { TaskDonut } from './TaskDonut.js';

export function TaskDonutDirective(){

  return{
    restrict: 'E',
    replace: true,
    template:'<svg viewBox="0 0 200 200" class="TaskDonut"></svg>',
    link: function($scope, el, attr){
      var newDonut = new TaskDonut(Snap(el[0]), $scope.taskData.tasks);

      /*
      * when the donut is used, it affects data
      * outside of the angular digest loop so
      * we have to call apply for angular to
      * refresh the scope
      * */

      newDonut.onUserUpdatedDonutManually(function(updatedTaskSet){
        $scope.$apply();
      });

      $scope.taskDonuts.push(newDonut);

    }
  }

}
