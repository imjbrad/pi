/**
 * Created by jordanbradley on 4/23/16.
 */
import { TaskManager } from "../components/TaskManager";
import { Day } from "../components/DayHelper";

export function TourController($scope, $timeout, $filter) {
    'ngInject';

    var today = new Day();

    $scope.taskData = {
        day: today.string,
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


    $scope.openCamera = function(){
        var camera = $("#camera"),
            height = camera.height(),
            width = 240;

        Webcam.set({
            // live preview size
            width: 320,
            height: 240,

            // device capture size
            dest_width: 640,
            dest_height: 480,

            // final cropped size
            crop_width: 480,
            crop_height: 480,

            // format and quality
            image_format: 'jpeg',
            jpeg_quality: 90
        });

        Webcam.attach('#camera');
    };

    $timeout(function(){
        $scope.openCamera();
    });

}