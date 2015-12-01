import { TaskDonut } from './TaskDonut.js';

export function TaskDonutDirective(){

  return{
    restrict: 'E',
    replace: true,
    template:'<svg viewBox="0 0 200 200" class="TaskDonut"></svg>',
    link: function($scope, el, attr){
      var newDonut = new TaskDonut(Snap(el[0]), $scope.taskData.tasks);

      newDonut.onupdated(function(){
        $scope.$apply();
      });

      newDonut.setIndex(parseInt(attr.index));
      newDonut.setTag(attr.tag);

      $scope.taskDonuts.push(newDonut);
    }
  }

}
