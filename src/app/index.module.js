/* global malarkey:false, moment:false */

import { config } from './index.config';
import { routerConfig } from './index.route';
import { runBlock } from './index.run';

import './components/eve.js';

import { MainController } from './main/main.controller';
import { TourController } from './tour/tour.controller'

import { TaskDonut } from './components/TaskDonut/TaskDonut.js';
import { TaskDonutDirective } from './components/TaskDonut/TaskDonutDirective.js';
import { TaskSlice } from './components/TaskDonut/TaskSlice.js';
import { Bucket } from './components/Bucket.js';
import { BucketRing } from './components/BucketRing.js';

import { TaskStrip, TaskStripDirective } from './components/TaskStrip/TaskStrip.js';
import { TaskDetailPanelDirective } from './components/TaskDetailPanel/TaskDetailPanelDirective';

import { EmojiPicker } from './components/emoji-picker/emojipicker.directives.js';
import { SliderDirective } from './components/slider/directives.slider.js';

import './components/datepicker/datepicker.js';

import './components/PiSnapPlugins.js';

angular.module('app', ['ngResource', 'ui.router', 'ui.bootstrap','ui.sortable', 'material.components.datepicker'])
  .constant('moment', moment)
  .config(config)
  .config(routerConfig)
  .run(runBlock)

  .controller('MainController', MainController)
  .controller('TourController', TourController)

  .directive('taskDetailPanel', TaskDetailPanelDirective)
  .directive('emojiPicker', EmojiPicker)
  .directive('taskDonut', TaskDonutDirective)
  .directive('taskStrip', TaskStripDirective)
  .directive('slider', SliderDirective)

  ;
