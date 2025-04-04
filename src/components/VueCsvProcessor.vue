<!-- 
  Main wrapper component for CSV processor
  Provides context and state for all child components
-->
<template>
    <div class="vue-csv-processor">
        <!-- Default slot for child components -->
        <slot :file="file" :errors="errors" :fields="fields" :mapping="mapping" :hasHeaders="hasHeaders"
            :csvData="parsedData" :rawContent="rawContent" :encoding="encoding"></slot>
    </div>
</template>

<script>
import { defineComponent, ref, reactive, provide, computed, watch } from 'vue';
import { parseCSV, detectDelimiter } from '../utils/csv-parser';
import { detectEncoding, readWithEncoding, SUPPORTED_ENCODINGS } from '../utils/encoding-detector';

export default defineComponent({
    name: 'VueCsvProcessor',

    props: {
        /**
         * v-model binding for the processed CSV data
         */
        modelValue: {
            type: Array,
            default: () => []
        },

        /**
         * Field definitions to map CSV columns to
         * Format: { fieldName: { required: true|false, label: 'Display Label' } }
         */
        fields: {
            type: Object,
            required: true
        },

        /**
         * Custom text overrides
         */
        text: {
            type: Object,
            default: () => ({
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
            })
        },

        /**
         * Auto map CSV columns to fields by name
         */
        autoMatch: {
            type: Boolean,
            default: true
        },

        /**
         * Default encoding to use
         */
        defaultEncoding: {
            type: String,
            default: 'UTF-8'
        }
    },

    emits: ['update:modelValue', 'file-loaded', 'encoding-changed', 'headers-toggled', 'data-updated', 'mapping-updated'],

    setup(props, { emit }) {
        // State
        const file = ref(null);
        const fileBuffer = ref(null);
        const rawContent = ref('');
        const hasHeaders = ref(true);
        const parsedData = ref([]);
        const parsedHeaders = ref([]);
        const errors = ref([]);
        const encoding = ref(props.defaultEncoding);
        const supportedEncodings = ref(SUPPORTED_ENCODINGS);

        // Mapping between fields and CSV columns
        const mapping = reactive({});

        // Computed
        const processedData = computed(() => {
            if (!parsedData.value || !parsedData.value.length) return [];

            return parsedData.value.map(row => {
                const mappedRow = {};

                // Apply column mapping to create the final data
                Object.keys(mapping).forEach(field => {
                    const mappedColumn = mapping[field];
                    if (mappedColumn && mappedColumn in row) {
                        mappedRow[field] = row[mappedColumn];
                    } else {
                        mappedRow[field] = '';
                    }
                });

                return mappedRow;
            });
        });

        // Watch for changes to processed data and update v-model
        watch(processedData, (newValue) => {
            emit('update:modelValue', newValue);
            emit('data-updated', newValue);
        }, { deep: true });

        // Watch for changes to mapping
        watch(mapping, (newValue) => {
            emit('mapping-updated', newValue);
        }, { deep: true });

        // Methods

        /**
         * Set the file to be processed
         */
        const setFile = async (newFile) => {
            file.value = newFile;
            errors.value = [];

            if (!newFile) {
                parsedData.value = [];
                parsedHeaders.value = [];
                fileBuffer.value = null;
                rawContent.value = '';
                return;
            }

            try {
                // Read file as ArrayBuffer for encoding detection
                fileBuffer.value = await readAsArrayBuffer(newFile);

                // Auto-detect encoding if not explicitly set
                if (encoding.value === props.defaultEncoding) {
                    encoding.value = detectEncoding(fileBuffer.value) || props.defaultEncoding;
                }

                // Process the file with the detected/selected encoding
                await processFile();

                emit('file-loaded', file.value);
            } catch (err) {
                errors.value.push(`Error loading file: ${err.message}`);
            }
        };

        /**
         * Read file as ArrayBuffer
         */
        const readAsArrayBuffer = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(new Error('Error reading file'));
                reader.readAsArrayBuffer(file);
            });
        };

        /**
         * Process the file with the current encoding
         */
        const processFile = async () => {
            if (!file.value || !fileBuffer.value) {
                return;
            }

            try {
                // Read the file with the selected encoding
                rawContent.value = await readWithEncoding(fileBuffer.value, encoding.value);

                // Auto-detect delimiter
                const delimiter = detectDelimiter(rawContent.value);

                // Parse the CSV content
                const result = parseCSV(rawContent.value, {
                    hasHeaders: hasHeaders.value,
                    delimiter,
                    trimFields: true,
                    encoding: encoding.value,
                    skipEmptyLines: true
                });

                // Update state with parsed results
                parsedData.value = result.data;
                parsedHeaders.value = result.headers;

                if (result.errors && result.errors.length) {
                    errors.value = [...errors.value, ...result.errors];
                }

                // Auto-map columns if enabled
                if (props.autoMatch) {
                    autoMapColumns();
                }
            } catch (err) {
                errors.value.push(`${props.text.errors.encodingError}: ${err.message}`);
            }
        };

        /**
         * Toggle whether the CSV has headers
         */
        const toggleHeaders = () => {
            hasHeaders.value = !hasHeaders.value;
            emit('headers-toggled', hasHeaders.value);

            // Re-process file when header setting changes
            if (file.value) {
                processFile();
            }
        };

        /**
         * Change the text encoding and reprocess the file
         */
        const changeEncoding = async (newEncoding) => {
            encoding.value = newEncoding;
            emit('encoding-changed', newEncoding);

            if (file.value && fileBuffer.value) {
                await processFile();
            }
        };

        /**
         * Auto-map CSV columns to fields based on name similarity
         */
        const autoMapColumns = () => {
            if (!parsedHeaders.value.length) return;

            // Get field keys
            const fieldKeys = Object.keys(props.fields);

            // Clear current mapping
            Object.keys(mapping).forEach(key => {
                delete mapping[key];
            });

            // For each field, try to find a matching header
            fieldKeys.forEach(fieldKey => {
                const fieldLabel = props.fields[fieldKey].label || fieldKey;

                // Try to find an exact match
                let matchIndex = parsedHeaders.value.findIndex(header =>
                    header.toLowerCase() === fieldLabel.toLowerCase()
                );

                // If no exact match, try to find a partial match
                if (matchIndex === -1) {
                    matchIndex = parsedHeaders.value.findIndex(header =>
                        header.toLowerCase().includes(fieldLabel.toLowerCase()) ||
                        fieldLabel.toLowerCase().includes(header.toLowerCase())
                    );
                }

                // If a match is found, set up the mapping
                if (matchIndex !== -1) {
                    mapping[fieldKey] = parsedHeaders.value[matchIndex];
                }
            });
        };

        /**
         * Map a field to a specific CSV column
         */
        const mapField = (field, column) => {
            mapping[field] = column;
        };

        /**
         * Get sample data (first few rows) for preview
         */
        const getSampleData = (rowCount = 5) => {
            return parsedData.value.slice(0, rowCount);
        };

        // Provide values and methods to child components
        provide('csvProcessor', {
            // State
            file,
            hasHeaders,
            parsedData,
            parsedHeaders,
            errors,
            encoding,
            supportedEncodings,
            mapping,
            rawContent,
            fileBuffer,
            text: props.text,
            fields: props.fields,

            // Methods
            setFile,
            toggleHeaders,
            changeEncoding,
            mapField,
            getSampleData,
            processFile,
            autoMapColumns
        });

        return {
            // State
            file,
            hasHeaders,
            parsedData,
            parsedHeaders,
            errors,
            encoding,
            supportedEncodings,
            mapping,
            rawContent,

            // Methods
            setFile,
            toggleHeaders,
            changeEncoding,
            mapField,
            getSampleData
        };
    }
});
</script>

<style scoped>
.vue-csv-processor {
    width: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
</style>