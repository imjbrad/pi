/**
 * Created by jordanbradley on 3/17/16.
 */

export function ThreeSegmentButton(taskStrip, settings) {

    var self = this,
        drawingArea = taskStrip.drawingArea;

    var segmentWidth = settings.width/3;

    var imageSize = 1.3;
    var smallImageSize = 1.05;


    var leftButton = drawingArea.rect();
    leftButton.attr({x: settings.x, y: settings.y, width: segmentWidth, height: settings.height, fill: "#ffffff", fillOpacity: .8, stroke: "#cccccc", strokeWidth: .03});
    var leftBox = leftButton.getBBox();
    var leftIcon = drawingArea.image(settings.leftIcon || "app/assets/plus.svg", leftBox.cx - smallImageSize/2, leftBox.cy - smallImageSize/2, smallImageSize, smallImageSize);


    var middle = drawingArea.rect();
    middle.attr({x: settings.x + (segmentWidth), y: settings.y, width: segmentWidth, height: settings.height, fill:"#f7f1eb"});
    var middleBox = middle.getBBox();
    var middleIcon = drawingArea.image(settings.image, middleBox.cx - imageSize/2, middleBox.cy - imageSize/2, imageSize, imageSize);

    var rightButton = drawingArea.rect();
    rightButton.attr({x: settings.x + (segmentWidth*2), y: settings.y, width: segmentWidth, height: settings.height, fill: "#ffffff", fillOpacity: .8, stroke:"#cccccc", strokeWidth: .03});
    var rightBox = rightButton.getBBox();
    var rightIcon = drawingArea.image(settings.rightIcon || "app/assets/minus.svg", rightBox.cx - smallImageSize/2, rightBox.cy - smallImageSize/2, smallImageSize, smallImageSize);

    self.leftButton = drawingArea.g();
    self.leftButton.add(leftButton, leftIcon);

    self.middleButton = drawingArea.g();
    self.middleButton.add(middle, middleIcon);

    self.rightButton = drawingArea.g();
    self.rightButton.add(rightButton, rightIcon);

    self.hide = function(){
        $([self.leftButton.node, self.middleButton.node, self.rightButton.node]).hide();
    }

}