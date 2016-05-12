import { PiUtilities } from '../../components/PiUtilities.js';
import { TaskManager } from '../../components/TaskManager.js';
import { TaskDonut } from '../../components/TaskDonut/TaskDonut.js';
import { TaskStrip } from '../../components/TaskStrip/TaskStrip.js';
import { Day } from '../../components/DayHelper.js';

export function DonutViewController($scope, $timeout, $filter) {

    'ngInject';

    var today = new Day();

    $scope.taskData = {
        picture: "/assets/terron.jpg",
        wakeUpTime: today.at("7:30 am"),
        bedTime: today.nextDay().at("2:00 am"),
        sleepGoal: "08:00",
        tasks: []
    };

    $scope.taskManager = new TaskManager($scope.taskData);

    $scope.showCamera = false;

}
