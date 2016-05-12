/**
 * Created by jordanbradley on 5/7/16.
 */

import { TaskManager } from "../../components/TaskManager";
import { TaskDonut } from "../../components/TaskDonut/TaskDonut";
import { Day } from "../../components/DayHelper";

export function TourStepTwoController($scope, $rootScope) {
    'ngInject';

    Number.prototype.isBetween = function(a, b){
      return (this >= a && this <= b);
    };

    $scope.sleepSliderValue = 0;

    $scope.determineBedtime = function(_bedTimeModel) {

        $scope.sleepForm.bedTimeInput.$setValidity("valid", true);

        var bedTimeModel = _bedTimeModel || $scope.bedTimeModel;
        var bedTimeMoment = moment(bedTimeModel, "h:mma");

        if(!bedTimeMoment.isValid()){
            $scope.sleepForm.bedTimeInput.$setValidity("valid", false);
            return;
        }

        $scope.bedTime = bedTimeMoment;

        var hasAM = bedTimeModel.includes("am") || bedTimeModel.includes("a") || bedTimeModel.includes("AM") || bedTimeModel.includes("A"),
            hasPM = bedTimeModel.includes("pm") || bedTimeModel.includes("p") || bedTimeModel.includes("PM") || bedTimeModel.includes("P");

        if(!hasAM && !hasPM){
            console.log("doesn't have am or pm");
            $scope.sleepForm.bedTimeInput.$setValidity("valid", false);
            return;
        }

        if(hasAM){
            $scope.bedTime.add(1, 'day')
        }

        console.log($scope.bedTime);
        return $scope.bedTime;
    };

    $scope.adjustBedTime = function(increaseOrDecrease){

        var oTime = $scope.determineBedtime($scope.bedTimeModel);

        if(increaseOrDecrease == "+"){
            oTime.add("30", "m");
        }

        else if(increaseOrDecrease == "-"){
            oTime.subtract("30", "m");
        }

        $scope.bedTimeModel = oTime.format("h:mma");
        $scope.determineBedtime($scope.bedTimeModel);
    };

    $scope.determineRecommendedSleepHoursForAge = function(_ageModel) {

        var age = _ageModel || $scope.ageModel,
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

    };

    $scope.configureSleep = function(){
        if(!$scope.sleepForm.$valid){
            if(!$scope.sleepForm.bedTimeInput.valid){
                alert("Be sure to specify a bed time in the correct format, with AM or PM. ie: 10:30pm or 1:00am");
            }
            return;
        }
        if($rootScope.tourInProgress){
            $rootScope.advanceTour();
        }
    }


}