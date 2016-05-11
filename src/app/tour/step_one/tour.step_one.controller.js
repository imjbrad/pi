/**
 * Created by jordanbradley on 4/23/16.
 */
import { TaskManager } from "../../components/TaskManager";
import { TaskDonut } from "../../components/TaskDonut/TaskDonut";
import { Day } from "../../components/DayHelper";

export function TourStepOneController($rootScope, $scope, $timeout, $state, $location, $http) {
    'ngInject';

}

export function AttachWebcamDirective(){
    return{
        restrict: 'A',
        link: function(scope, el, attr){

            var camera = el,
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

            Webcam.attach(el[0]);

        }
    }
}