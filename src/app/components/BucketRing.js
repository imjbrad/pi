/**
 * Created by jordanbradley on 12/1/15.
 */
import { Bucket } from './Bucket.js'

export function BucketRing(_TaskDonut, _presetType) {

  //private
  var self = this,
    init,
    _initWeeklyBuckets,
    default_angular_size = 120,
    default_number_of_buckets = 6,
    TaskDonut = _TaskDonut,
    group = TaskDonut.drawingArea.g(),
    presetType = _presetType;

  _initWeeklyBuckets = function(angularRotation, totalAngularSize, numberOfBuckets){
    self.buckets = [];

    var totalAngularSize = Snap.rad(totalAngularSize || default_angular_size),
      numberOfBuckets = numberOfBuckets || default_number_of_buckets;

    //create evenly sized numberOfBuckets within totalAngularSize
    var angularSizePerBucket = totalAngularSize/numberOfBuckets;

    for(var i=0; i<numberOfBuckets; i++){
      var startingAngle = (i*angularSizePerBucket);

      var bucket = new Bucket(TaskDonut, startingAngle, angularSizePerBucket);
      self.buckets.push(bucket);
      group.add(bucket.g());
    }

    self.buckets[0].assign({"label": "M"});
    self.buckets[1].assign({"label": "T"});
    self.buckets[2].assign({"label": "W"});
    self.buckets[3].assign({"label": "TH"});
    self.buckets[4].assign({"label": "F"});
    self.buckets[5].assign({"label": "S"});

    group.attr({opacity: 0});

  };

  init = function(presetType) {

    if(presetType == "weekly"){
      _initWeeklyBuckets(default_angular_size, default_angular_size, default_number_of_buckets);
    }

  };

  self.show = function(){
    group.animate({opacity: 1}, 30);
  };

  self.hide = function(){
    group.animate({opacity: 0}, 30);
  };

  init(presetType || "weekly");

}
