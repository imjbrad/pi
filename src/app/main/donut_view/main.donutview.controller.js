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
        tasks: [
            {
                name: "Work at the Studio",
                start: today.at("7:30 am"),
                end: today.at("1:30 pm"),
                emoji: '1f3c0.png',
                tempData: {}
            },
            {
                name: "Gym",
                start: today.at("3:00 pm"),
                end: today.at("4:00 pm"),
                color: '#7e3c46',
                emoji: '1f4d0.png',
                tempData: {}
            },
            {
                name: "Return rentals",
                start: today.at("4:00 pm"),
                end: today.at("5:00 pm"),
                emoji: '1f4de.png',
                tempData: {}
            },
            {
                name: "Finish Paper",
                start: today.at("8:00 pm"),
                end: today.at("11:30 pm"),
                emoji: '1f62d.png',
                tempData: {}
            }
        ]
    };

    $scope.taskManager = new TaskManager($scope.taskData);

    $scope.showCamera = false;

}
