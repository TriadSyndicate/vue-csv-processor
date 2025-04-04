<!-- 
  Column mapping component for associating CSV columns with data fields
  Allows users to specify which CSV column maps to each required field
-->
<template>
    <div class="vue-csv-map">
        <!-- Empty state when no CSV data is loaded -->
        <div v-if="!hasData" class="map-empty">
            <p>Upload a CSV file to map columns</p>
        </div>

        <!-- Mapping UI when CSV data is available -->
        <div v-else>
            <!-- Default UI -->
            <div v-if="!$slots.default">
                <table class="mapping-table" :class="{ 'no-thead': noThead }">
                    <thead v-if="!noThead">
                        <tr>
                            <th class="field-column">{{ text.fieldColumn }}</th>
                            <th class="csv-column">{{ text.csvColumn }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(field, fieldName) in fields" :key="fieldName" class="mapping-row">
                            <td class="field-column">
                                <div class="field-info">
                                    <span class="field-name">{{ field.label || fieldName }}</span>
                                    <span v-if="field.required" class="required-indicator">*</span>
                                </div>
                            </td>
                            <td class="csv-column">
                                <select :value="mapping[fieldName]"
                                    @change="updateMapping(fieldName, $event.target.value)" class="mapping-select"
                                    v-bind="selectAttributes">
                                    <option value="">-- Select Column --</option>
                                    <option v-for="(header, index) in parsedHeaders" :key="index" :value="header">
                                        {{ header }}
                                        <template v-if="sampleData.length && sampleData[0][header]">
                                            (e.g. {{ formatSampleValue(sampleData[0][header]) }})
                                        </template>
                                    </option>
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Required fields reminder -->
                <div v-if="hasMissingRequiredFields" class="required-reminder">
                    <p>* Required fields must be mapped</p>
                </div>
            </div>

            <!-- Custom UI via slot -->
            <slot v-else :sample="sampleData" :mapping="mapping" :fields="fields" :parsedHeaders="parsedHeaders"
                :updateMapping="updateMapping"></slot>
        </div>
    </div>
</template>

<script>
import { defineComponent, inject, computed, watch, onMounted } from 'vue';

export default defineComponent({
    name: 'VueCsvMap',

    props: {
        /**
         * Hide table header
         */
        noThead: {
            type: Boolean,
            default: false
        },

        /**
         * Additional attributes to bind to the select inputs
         */
        selectAttributes: {
            type: Object,
            default: () => ({})
        },

        /**
         * Auto-match fields to columns when they share the same name
         */
        autoMatch: {
            type: Boolean,
            default: true
        },

        /**
         * Ignore case when auto-matching
         */
        autoMatchIgnoreCase: {
            type: Boolean,
            default: true
        }
    },

    emits: ['update:mapping', 'mapping-change'],

    setup(props, { emit }) {
        // Connect to parent component
        const csvProcessor = inject('csvProcessor');

        // Get state from parent
        const fields = computed(() => csvProcessor.fields);
        const parsedHeaders = computed(() => csvProcessor.parsedHeaders.value || []);
        const parsedData = computed(() => csvProcessor.parsedData.value || []);
        const mapping = computed(() => csvProcessor.mapping);
        const text = computed(() => csvProcessor.text);

        // Check if data is available
        const hasData = computed(() => parsedData.value.length > 0 && parsedHeaders.value.length > 0);

        // Get sample data for preview
        const sampleData = computed(() => parsedData.value.slice(0, 1));

        // Check if any required fields are not mapped
        const hasMissingRequiredFields = computed(() => {
            return Object.entries(fields.value).some(([fieldName, fieldConfig]) => {
                return fieldConfig.required && !mapping.value[fieldName];
            });
        });

        // Update mapping for a field
        const updateMapping = (field, column) => {
            csvProcessor.mapField(field, column);
            emit('update:mapping', { ...mapping.value });
            emit('mapping-change', { field, column });
        };

        // Format sample value for display
        const formatSampleValue = (value) => {
            if (value === null || value === undefined) return '';

            // Truncate long values
            if (typeof value === 'string' && value.length > 20) {
                return value.substring(0, 20) + '...';
            }

            return value.toString();
        };

        // Auto-match fields to columns when data is loaded
        const autoMatchFields = () => {
            if (!props.autoMatch || !hasData.value) return;

            Object.keys(fields.value).forEach(fieldName => {
                // Skip if already mapped
                if (mapping.value[fieldName]) return;

                const fieldLabel = fields.value[fieldName].label || fieldName;

                // Find matching header
                let matchIndex = -1;

                if (props.autoMatchIgnoreCase) {
                    // Case-insensitive match
                    matchIndex = parsedHeaders.value.findIndex(header =>
                        header.toLowerCase() === fieldLabel.toLowerCase() ||
                        header.toLowerCase() === fieldName.toLowerCase()
                    );
                } else {
                    // Case-sensitive match
                    matchIndex = parsedHeaders.value.findIndex(header =>
                        header === fieldLabel || header === fieldName
                    );
                }

                if (matchIndex !== -1) {
                    updateMapping(fieldName, parsedHeaders.value[matchIndex]);
                }
            });
        };

        // Auto-match on mount and when data changes
        onMounted(() => {
            if (hasData.value) {
                autoMatchFields();
            }
        });

        watch(() => parsedHeaders.value, (newHeaders, oldHeaders) => {
            if (newHeaders.length > 0 && (!oldHeaders || oldHeaders.length === 0)) {
                autoMatchFields();
            }
        });

        return {
            fields,
            parsedHeaders,
            mapping,
            text,
            hasData,
            sampleData,
            hasMissingRequiredFields,
            updateMapping,
            formatSampleValue
        };
    }
});
</script>

<style scoped>
.vue-csv-map {
    margin-bottom: 1.5rem;
}

.map-empty {
    background-color: #f9f9f9;
    padding: 2rem;
    text-align: center;
    border-radius: 0.375rem;
    color: #666;
    border: 1px dashed #ddd;
}

.mapping-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    overflow: hidden;
    background-color: white;
}

.mapping-table thead th {
    padding: 0.75rem 1rem;
    text-align: left;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    font-weight: 600;
    color: #4a5568;
}

.field-column {
    width: 40%;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
}

.csv-column {
    width: 60%;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
}

.field-info {
    display: flex;
    align-items: center;
}

.field-name {
    font-weight: 500;
    color: #2d3748;
}

.required-indicator {
    color: #e53e3e;
    margin-left: 0.25rem;
    font-weight: bold;
}

.mapping-select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #cbd5e0;
    border-radius: 0.25rem;
    background-color: white;
    color: #2d3748;
    font-size: 0.875rem;
}

.required-reminder {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #e53e3e;
}

.no-thead tr:first-child td {
    border-top: none;
}
</style>