# Vue CSV Processor

A Vue 3 component library for CSV file processing with robust encoding detection, preview, and column mapping.

## Features

- 🌐 **Multi-Encoding Support**: Automatically detect and switch between encodings (UTF-8, ISO-8859-1, Windows-1252, etc.)
- 📊 **Live Data Preview**: View your data with different encodings before processing
- 🗄️ **Column Mapping**: Map CSV columns to your data structure with auto-matching
- 📝 **Header Row Control**: Toggle whether the first row should be treated as headers
- 🧠 **Smart Parsing**: Handles complex CSV data with embedded commas, quotes, and special characters
- 🚨 **Error Handling**: Clear error messages for parsing and validation issues
- 🧩 **Modular Components**: Use all components together or pick just what you need
- 🎨 **Custom Styling**: All components can be fully styled or replaced with custom markup

## Installation

```bash
# npm
npm install vue-csv-processor

# Yarn
yarn add vue-csv-processor
```

## Usage

### Basic Example

```vue
<template>
  <div>
    <h1>CSV Importer</h1>
    
    <VueCsvProcessor 
      v-model="csvData" 
      :fields="fields"
    >
      <VueCsvInput />
      <VueCsvToggleHeaders />
      <VueCsvPreview />
      <VueCsvErrors />
      <VueCsvMap />
      
      <div v-if="csvData.length" class="actions">
        <button @click="processData">Submit Data</button>
      </div>
    </VueCsvProcessor>
    
    <pre v-if="csvData.length">{{ csvData }}</pre>
  </div>
</template>

<script>
import { ref, defineComponent } from 'vue';
import { 
  VueCsvProcessor, 
  VueCsvInput, 
  VueCsvToggleHeaders,
  VueCsvPreview,
  VueCsvMap,
  VueCsvErrors
} from 'vue-csv-processor';

export default defineComponent({
  components: {
    VueCsvProcessor,
    VueCsvInput,
    VueCsvToggleHeaders,
    VueCsvPreview,
    VueCsvMap,
    VueCsvErrors
  },
  
  setup() {
    const csvData = ref([]);
    
    const fields = {
      name: { required: true, label: 'Full Name' },
      email: { required: true, label: 'Email Address' },
      phone: { required: false, label: 'Phone Number' },
      address: { required: false, label: 'Address' }
    };
    
    const processData = () => {
      // Do something with csvData.value
      console.log('Processed data:', csvData.value);
    };
    
    return {
      csvData,
      fields,
      processData
    };
  }
});
</script>
```

### Global Registration

You can register all components globally:

```js
// main.js
import { createApp } from 'vue';
import App from './App.vue';
import { VueCsvProcessorPlugin } from 'vue-csv-processor';

const app = createApp(App);
app.use(VueCsvProcessorPlugin);
app.mount('#app');
```

## Components

### VueCsvProcessor

The main wrapper component that provides context and state for all child components.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| modelValue | Array | `[]` | v-model binding for the processed CSV data |
| fields | Object | Required | Field definitions to map CSV columns to |
| text | Object | See below | Custom text overrides |
| autoMatch | Boolean | `true` | Auto map CSV columns to fields by name |
| defaultEncoding | String | `'UTF-8'` | Default encoding to use |

#### Default Text

```js
{
  errors: {
    fileRequired: 'A file is required',
    invalidMimeType: 'Invalid file type',
    encodingError: 'Error processing file with selected encoding'
  },
  toggleHeaders: 'File has headers',
  submitBtn: 'Submit',
  fieldColumn: 'Field',
  csvColumn: 'Column',
  encoding: 'Text Encoding'
}
```

#### Slot Props

| Prop | Description |
|------|-------------|
| file | The selected file |
| errors | Current errors |
| fields | Field definitions |
| mapping | Current column mapping |
| hasHeaders | Whether CSV is treated as having headers |
| csvData | Parsed CSV data |
| rawContent | Raw CSV content |
| encoding | Current encoding |

### VueCsvInput

File input component for selecting CSV files.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| name | String | `'csv-file'` | Input field name |
| accept | String | `'.csv,text/csv,...'` | Accepted file types |
| validation | Boolean | `true` | Whether to perform validation |
| fileMimeTypes | Array | `['text/csv', ...]` | Allowed file MIME types |
| maxSize | Number | `5242880` | Maximum file size (5MB) |
| disabled | Boolean | `false` | Whether the input is disabled |

#### Slot Props

| Prop | Description |
|------|-------------|
| file | The selected file |
| change | Function to handle file change |
| remove | Function to remove the file |
| errors | File errors |

### VueCsvPreview

Preview component for viewing CSV data with encoding selection.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| encoding | String | `'UTF-8'` | Selected encoding (v-model:encoding) |
| encodings | Array | `[all supported encodings]` | List of encodings to show |
| rowCount | Number | `5` | Number of preview rows |
| showRowNumbers | Boolean | `true` | Whether to show row numbers |
| encodingSelectId | String | `'csv-encoding-select'` | ID for the encoding select |

#### Slot Props

| Prop | Description |
|------|-------------|
| previewData | Data for preview |
| parsedHeaders | CSV headers |
| totalRows | Total number of rows |
| encoding | Current encoding |
| supportedEncodings | Available encodings |
| changeEncoding | Function to change encoding |
| hasEncodingIssues | Whether encoding issues are detected |

### VueCsvToggleHeaders

Toggle component for setting whether CSV has headers.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| toggleId | String | `'csv-has-headers'` | HTML ID for the checkbox |
| checkboxAttributes | Object | `{}` | Additional attributes for checkbox |
| labelAttributes | Object | `{}` | Additional attributes for label |

#### Slot Props

| Prop | Description |
|------|-------------|
| hasHeaders | Whether CSV is treated as having headers |
| toggle | Function to toggle headers |

### VueCsvMap

Column mapping component for associating CSV columns with data fields.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| noThead | Boolean | `false` | Hide table header |
| selectAttributes | Object | `{}` | Additional attributes for select inputs |
| autoMatch | Boolean | `true` | Auto-match fields to columns by name |
| autoMatchIgnoreCase | Boolean | `true` | Ignore case when auto-matching |

#### Slot Props

| Prop | Description |
|------|-------------|
| sample | Sample data for preview |
| mapping | Current column mapping |
| fields | Field definitions |
| parsedHeaders | CSV headers |
| updateMapping | Function to update mapping |

### VueCsvErrors

Error display component for showing CSV parsing and validation errors.

#### Slot Props

| Prop | Description |
|------|-------------|
| errors | List of errors |

## Utilities

The package also exports some utility functions:

```js
import { parseCSV, detectEncoding } from 'vue-csv-processor';

// Parse CSV content manually
const result = parseCSV(csvContent, {
  hasHeaders: true,
  delimiter: ',',
  trimFields: true,
  encoding: 'UTF-8'
});

// Detect encoding from file buffer
const detectedEncoding = detectEncoding(fileBuffer);
```

## Styling

All components include basic styling with scoped CSS. You can override these styles or provide completely custom markup using slots.

## License

MIT