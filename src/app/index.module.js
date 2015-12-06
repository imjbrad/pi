/* global malarkey:false, moment:false */

import { config } from './index.config';
import { routerConfig } from './index.route';
import { runBlock } from './index.run';
import { MainController } from './main/main.controller';

import { TaskDonut } from './components/TaskDonut.js';
import { TaskDonutDirective } from './components/TaskDonutDirective.js';
import { TaskSlice } from './components/TaskSlice.js';
import { Bucket } from './components/Bucket.js';
import { BucketRing } from './components/BucketRing.js';

import { EmojiPicker } from './components/emoji-picker/emojipicker.directives.js';
import { SliderDirective } from './components/slider/directives.slider.js';

angular.module('app', ['ngResource', 'ui.router', 'ui.bootstrap','ui.sortable'])
  .constant('moment', moment)
  .config(config)
  .config(routerConfig)
  .run(runBlock)

  .controller('MainController', MainController)

  .directive('emojiPicker', EmojiPicker)
  .directive('taskDonut', TaskDonutDirective)
  .directive('slider', SliderDirective)

  ;
