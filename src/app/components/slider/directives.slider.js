export function SliderDirective(){

        return {
            restrict: 'E',
            replace: false,
            scope: {
                sliderValue: '='
            },
            templateUrl: 'app/components/slider/slider.html',
            link: function($scope, element, attr, $interval) {

                var slider_bar = angular.element('.slider-bar', element),
                    value_bar = angular.element('.value-bar', slider_bar),
                    handle = angular.element('.handle', slider_bar),
                    draggable_overlay = angular.element('.draggable-overlay', slider_bar),
                    min = attr["min"] || 0,
                    max = attr["max"] || 100;

                function _xBound(element, point){
                    var bounds = element.getBoundingClientRect();
                    if((point.x < bounds.right) && (point.x > bounds.left))
                    {
                        return true;
                    }
                }

                //simple map number to range of numbers
                //http://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers
                function mapNum(i, in_min , in_max , out_min , out_max ) {
                    return ( i - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
                }

                function _findValue(bar, point){
                    var bounds = bar.getBoundingClientRect(),
                        i = point.x-bounds.left,
                        total = bounds.width
                        return {
                            "percentage": (i/total)*100,
                            "raw": Math.round((i/total)*max)
                        };
                }


                draggable_overlay[0].ondrag = function(e){

                    var ic = new Image();

                    ic.width = 0;
                    ic.height = 0;
                    ic.style.visibility = 'hidden';
                    ic.style.opacity = "0";

                    e.dataTransfer.setDragImage(ic, 1,1);
                    var dragging_point = {x: e.pageX, y: e.pageY};
                    if (_xBound(slider_bar[0], dragging_point)){
                        var value = _findValue(slider_bar[0], dragging_point);
                        value_bar[0].style.width = value.percentage+"%";
                        $scope.sliderValue = value.percentage;
                        $scope.$apply();
                        //console.log(value);
                    }
                }
            }
        };
    }