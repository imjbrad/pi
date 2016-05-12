import { PiUtilities } from '../../components/PiUtilities.js';
import { TaskManager } from '../../components/TaskManager.js';
import { TaskDonut } from '../../components/TaskDonut/TaskDonut.js';
import { TaskStrip } from '../../components/TaskStrip/TaskStrip.js';
import { Day } from '../../components/DayHelper.js';

export function DonutViewController($scope, $timeout, $rootScope) {

    'ngInject';

    var today = new Day();

    $scope.taskManager = new TaskManager($rootScope.taskData);

    $scope.showCamera = false;

}
