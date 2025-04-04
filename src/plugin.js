import VueCsvProcessor from './components/VueCsvProcessor.vue';
import VueCsvInput from './components/VueCsvInput.vue';
import VueCsvPreview from './components/VueCsvPreview.vue';
import VueCsvToggleHeaders from './components/VueCsvToggleHeaders.vue';
import VueCsvMap from './components/VueCsvMap.vue';
import VueCsvErrors from './components/VueCsvErrors.vue';

/**
 * Vue plugin for registering all CSV processor components globally
 */
export const VueCsvProcessorPlugin = {
  install: (app, options = {}) => {
    // Register all components globally
    app.component('VueCsvProcessor', VueCsvProcessor);
    app.component('VueCsvInput', VueCsvInput);
    app.component('VueCsvPreview', VueCsvPreview);
    app.component('VueCsvToggleHeaders', VueCsvToggleHeaders);
    app.component('VueCsvMap', VueCsvMap);
    app.component('VueCsvErrors', VueCsvErrors);
    
    // Set any global options
    if (options.globalProperties) {
      Object.keys(options.globalProperties).forEach(key => {
        app.config.globalProperties[key] = options.globalProperties[key];
      });
    }
  }
};

export default VueCsvProcessorPlugin;