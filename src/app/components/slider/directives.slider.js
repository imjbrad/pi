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
                    min = attr["min"] || 0,
                    max = attr["max"] || 100;

                //1x1 pixel transparent image for the dragging ghost
                var img = document.createElement("img");
                img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

                function _xBound(element, point){
                    var bounds = element.getBoundingClientRect();
                    if((point.x < bounds.right) && (point.x > bounds.left))
                    {
                        return true;
                    }
                }

                //simple map number to range of numbers
                //http://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers
                function _mapNum(i, in_min , in_max , out_min , out_max ) {
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

                function _setWidth(percentage){
                    value_bar[0].style.width = percentage+"%";
                }

                slider_bar[0].addEventListener("dragstart", function(e) {
                    e.dataTransfer.setDragImage(img, 0, 0);
                }, false);

                slider_bar[0].ondrag = function(e){
                    var dragging_point = {x: e.pageX, y: e.pageY};
                    if (_xBound(slider_bar[0], dragging_point)){
                        var value = _findValue(slider_bar[0], dragging_point);
                        $scope.sliderValue = value.percentage;
                        $scope.$apply();
                    }
                };

                $scope.$watch('sliderValue', function(){
                    var mappedvalue = _setWidth($scope.sliderValue);
                });
            }
        };
    }