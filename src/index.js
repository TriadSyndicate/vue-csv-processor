// Main components
import VueCsvProcessor from './components/VueCsvProcessor.vue';
import VueCsvInput from './components/VueCsvInput.vue';
import VueCsvPreview from './components/VueCsvPreview.vue';
import VueCsvToggleHeaders from './components/VueCsvToggleHeaders.vue';
import VueCsvMap from './components/VueCsvMap.vue';
import VueCsvErrors from './components/VueCsvErrors.vue';

// Utilities
import { parseCSV } from './utils/csv-parser';
import { detectEncoding } from './utils/encoding-detector';

// Vue plugin
import { VueCsvProcessorPlugin } from './plugin';

// Export individual components
export {
  VueCsvProcessor,
  VueCsvInput,
  VueCsvPreview,
  VueCsvToggleHeaders,
  VueCsvMap,
  VueCsvErrors,
  parseCSV,
  detectEncoding,
  VueCsvProcessorPlugin
};

// Export default plugin
export default VueCsvProcessorPlugin;