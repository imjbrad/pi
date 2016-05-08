/**
 * Created by jordanbradley on 5/7/16.
 */

import { TaskManager } from "../../components/TaskManager";
import { TaskDonut } from "../../components/TaskDonut/TaskDonut";
import { Day } from "../../components/DayHelper";

export function TourStepTwoController($scope) {
    'ngInject';

    Number.prototype.isBetween = function(a, b){
      return (this >= a && this <= b);
    };

    $scope.sleepSliderValue = 0;

    $scope.determineBedtime = function(_bedTimeInput) {
        var bedTimeInput = _bedTimeInput || $scope.bedTimeInput;
        $scope.bedTime = moment(bedTimeInput, "h:mma");

        if(bedTimeInput.includes("am") || bedTimeInput.includes("a")){
            $scope.bedTime.add(1, 'day')
        }

        console.log($scope.bedTime);
        return $scope.bedTime;
    };

    $scope.adjustBedTime = function(increaseOrDecrease){

        var oTime = $scope.determineBedtime($scope.bedTimeInput);

        if(increaseOrDecrease == "+"){
            oTime.add("30", "m");
        }

        else if(increaseOrDecrease == "-"){
            oTime.subtract("30", "m");
        }

        $scope.bedTimeInput = oTime.format("h:mma");
        $scope.determineBedtime($scope.bedTimeInput);
    };

    $scope.determineRecommendedSleepHoursForAge = function(_ageInput) {

        var age = _ageInput || $scope.ageInput,
            recommendedSleepHours;

        if(!age)
            return;

        if ((age).isBetween(6, 13)){
            recommendedSleepHours = [9, 11];
        }

        else if (age.isBetween(14, 17)){
            recommendedSleepHours = [8, 10];
        }

        else if (age.isBetween(18, 25)){
            recommendedSleepHours = [7, 9];
        }

        else if (age.isBetween(26, 64)){
            recommendedSleepHours = [7, 9];
        }

        else if (age >= 65){
            recommendedSleepHours = [7, 8];
        }

        if(recommendedSleepHours){
            $scope.recommendedSleepHours = recommendedSleepHours;
            $scope.sleepSliderValue = $scope.recommendedSleepHours[0] + 1;
        }

    }


}