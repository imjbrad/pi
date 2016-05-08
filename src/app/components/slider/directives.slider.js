import { PiUtilities } from '../PiUtilities.js';

export function SliderDirective(){

        return {
            restrict: 'E',
            replace: false,
            scope: {
                sliderValue: '=',
                min: '=',
                max: '='
            },
            templateUrl: 'app/components/slider/slider.html',
            link: function($scope, element, attr, $interval) {

                var slider_bar = angular.element('.slider-bar', element),
                    value_bar = angular.element('.value-bar', slider_bar),
                    handle = angular.element('.handle', slider_bar),
                    min,
                    max;

                //1x1 pixel transparent image for the dragging ghost
                var img = document.createElement("img");
                img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

                function refresh() {
                    determineMinMax();
                    setWidth();
                }

                function determineMinMax(){
                    min = $scope.min || 0;
                    max = $scope.max || 100;
                    console.log(min, max);
                }

                function _xBound(element, point){
                    var bounds = element.getBoundingClientRect();
                    return (point.x <= bounds.right + handle.width()) && (point.x >= bounds.left - handle.width());
                }

                function _mapNum(i) {
                    var mapped = ((i - min) / (max - min)) * 100;
                    return snap(mapped);
                }

                function _findValue(bar, point){

                    var bounds = bar.getBoundingClientRect(),
                        i = point.x-bounds.left,
                        total = bounds.width,
                        fraction = (i/total),
                        raw = Math.round(fraction*max),
                        percentage = (raw/max)*100;

                        if(raw <= min ){
                            raw = min;
                        }

                        if(raw >= max){
                            raw = max;
                        }

                        return {
                            "percentage": percentage,
                            "raw": raw
                        };
                }

                function setWidth(value){
                    var sliderValue = value || $scope.sliderValue;
                    if(sliderValue != undefined){
                        value_bar[0].style.width = _mapNum(sliderValue)+"%";
                    }
                }

                function snap(x, i){
                    var i = i || 1;
                    return Math.round(x/i)*i;
                }

                function moveSliderFromClickOrDrag(e){

                    var point = {x: e.pageX, y: e.pageY},
                        value = _findValue(slider_bar[0], point);

                    if(!point.x && !point.y)
                        return;

                    $scope.sliderValue = value.raw;
                    $scope.$apply();
                    console.log(value);
                }

                function setDragImage(e){
                    e.dataTransfer.setDragImage(img, 0, 0);
                }

                slider_bar[0].addEventListener("click", moveSliderFromClickOrDrag);
                slider_bar[0].addEventListener("dragstart", setDragImage);
                slider_bar[0].addEventListener("drag", moveSliderFromClickOrDrag);

                $scope.$watchGroup(['sliderValue', 'min', 'max'], function(){
                    refresh();
                });

            }
        };
    }