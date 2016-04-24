import { TaskDonut } from './TaskDonut.js';
import { TaskManager } from '../TaskManager';

export function TaskDonutDirective(){

  return{
    restrict: 'E',
    replace: true,
    scope: {
      taskDonutModel: "=",
      taskDonutManager: "="
    },
    template:'<svg viewBox="0 0 200 200" class="TaskDonut"></svg>',
    link: function($scope, el, attr){
      $scope.taskDonutModel = new TaskDonut(Snap(el[0]), $scope.taskDonutManager);
    }
  }

}
