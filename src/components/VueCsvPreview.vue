<!-- 
  Preview component for viewing CSV data with encoding selection
  Shows sample rows and allows switching between different encodings
-->
<template>
    <div class="vue-csv-preview">
        <!-- Default UI -->
        <div v-if="!$slots.default">
            <!-- Empty state -->
            <div v-if="!hasFile" class="preview-empty">
                <p>Upload a CSV file to preview data</p>
            </div>

            <!-- Preview with data -->
            <div v-else class="preview-container">
                <!-- Encoding selector -->
                <div class="encoding-selector">
                    <label :for="encodingSelectId" class="encoding-label">{{ text.encoding }}:</label>
                    <select :id="encodingSelectId" v-model="selectedEncoding" class="encoding-select"
                        @change="onEncodingChange">
                        <option v-for="encodingOption in supportedEncodings" :key="encodingOption.value"
                            :value="encodingOption.value">
                            {{ encodingOption.label }}
                        </option>
                    </select>
                </div>

                <!-- Data table -->
                <div class="preview-table-wrapper">
                    <table class="preview-table">
                        <thead>
                            <tr>
                                <th v-if="showRowNumbers" class="row-number-cell">#</th>
                                <th v-for="(header, index) in parsedHeaders" :key="index" class="header-cell">
                                    {{ header }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(row, rowIndex) in previewData" :key="rowIndex" class="data-row">
                                <td v-if="showRowNumbers" class="row-number-cell">{{ rowIndex + 1 }}</td>
                                <td v-for="(header, colIndex) in parsedHeaders" :key="colIndex" class="data-cell"
                                    :class="{ 'encoding-issue': hasEncodingIssue(row[header]) }">
                                    {{ row[header] }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Preview controls -->
                <div class="preview-controls">
                    <div class="preview-info">
                        <span>Showing {{ previewData.length }} of {{ totalRows }} rows</span>
                    </div>

                    <div class="preview-buttons">
                        <button class="preview-button" @click="previewRowCount = Math.max(5, previewRowCount - 5)"
                            :disabled="previewRowCount <= 5">
                            Show less
                        </button>
                        <button class="preview-button"
                            @click="previewRowCount = Math.min(totalRows, previewRowCount + 5)"
                            :disabled="previewRowCount >= totalRows">
                            Show more
                        </button>
                    </div>
                </div>

                <!-- Encoding note if we detect issues -->
                <div v-if="hasEncodingIssues" class="encoding-note">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"
                        class="warning-icon">
                        <path fill="none" d="M0 0h24v24H0z" />
                        <path
                            d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" />
                    </svg>
                    <span>
                        Some characters may not display correctly. Try a different encoding.
                    </span>
                </div>
            </div>
        </div>

        <!-- Custom UI via slot -->
        <slot v-else :previewData="previewData" :parsedHeaders="parsedHeaders" :totalRows="totalRows"
            :encoding="selectedEncoding" :supportedEncodings="supportedEncodings" :changeEncoding="onEncodingChange"
            :hasEncodingIssues="hasEncodingIssues"></slot>
    </div>
</template>

<script>
import { defineComponent, ref, inject, computed, watch } from 'vue';
import { SUPPORTED_ENCODINGS } from '../utils/encoding-detector';

export default defineComponent({
    name: 'VueCsvPreview',

    props: {
        /**
         * Selected encoding (v-model:encoding)
         */
        encoding: {
            type: String,
            default: 'UTF-8'
        },

        /**
         * List of encodings to show in the dropdown
         */
        encodings: {
            type: Array,
            default: () => SUPPORTED_ENCODINGS.map(e => e.value)
        },

        /**
         * Number of preview rows to show
         */
        rowCount: {
            type: Number,
            default: 5
        },

        /**
         * Whether to show row numbers
         */
        showRowNumbers: {
            type: Boolean,
            default: true
        },

        /**
         * Unique ID for the encoding select
         */
        encodingSelectId: {
            type: String,
            default: 'csv-encoding-select'
        }
    },

    emits: ['update:encoding', 'encoding-change'],

    setup(props, { emit }) {
        // Connect to parent component
        const csvProcessor = inject('csvProcessor');

        // Local state
        const selectedEncoding = ref(props.encoding);
        const previewRowCount = ref(props.rowCount);

        // Get state from parent
        const parsedData = computed(() => csvProcessor.parsedData.value || []);
        const parsedHeaders = computed(() => csvProcessor.parsedHeaders.value || []);
        const hasFile = computed(() => !!csvProcessor.file.value);
        const text = computed(() => csvProcessor.text);

        // Get supported encodings (filtered by props.encodings)
        const supportedEncodings = computed(() => {
            return SUPPORTED_ENCODINGS.filter(encoding =>
                props.encodings.includes(encoding.value)
            );
        });

        // Preview data (limited by row count)
        const previewData = computed(() => {
            return parsedData.value.slice(0, previewRowCount.value);
        });

        // Total rows
        const totalRows = computed(() => parsedData.value.length);

        // Check for encoding issues in the data
        const hasEncodingIssues = computed(() => {
            if (!previewData.value.length) return false;

            // Look for replacement characters or other indicators of encoding issues
            for (const row of previewData.value) {
                for (const header of parsedHeaders.value) {
                    if (hasEncodingIssue(row[header])) {
                        return true;
                    }
                }
            }

            return false;
        });

        // Check if a specific value has encoding issues
        const hasEncodingIssue = (value) => {
            if (typeof value !== 'string') return false;

            // Look for replacement character � (U+FFFD) or typical mojibake patterns
            return (
                value.includes('�') ||
                value.includes('Ã') ||
                /[\u{D800}-\u{DFFF}]/u.test(value)
            );
        };

        // Handle encoding change
        const onEncodingChange = () => {
            emit('update:encoding', selectedEncoding.value);
            emit('encoding-change', selectedEncoding.value);

            // Update encoding in parent component
            csvProcessor.changeEncoding(selectedEncoding.value);
        };

        // Watch for encoding prop changes
        watch(() => props.encoding, (newEncoding) => {
            selectedEncoding.value = newEncoding;
        });

        // Watch for encoding changes in parent
        watch(() => csvProcessor.encoding.value, (newEncoding) => {
            selectedEncoding.value = newEncoding;
        });

        return {
            selectedEncoding,
            previewRowCount,
            previewData,
            parsedHeaders,
            totalRows,
            hasFile,
            text,
            supportedEncodings,
            hasEncodingIssues,
            hasEncodingIssue,
            onEncodingChange
        };
    }
});
</script>

<style scoped>
.vue-csv-preview {
    margin-bottom: 1.5rem;
}

.preview-empty {
    background-color: #f9f9f9;
    padding: 2rem;
    text-align: center;
    border-radius: 0.375rem;
    color: #666;
    border: 1px dashed #ddd;
}

.preview-container {
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    overflow: hidden;
}

.encoding-selector {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.encoding-label {
    font-weight: 500;
    margin-right: 0.5rem;
    color: #4a5568;
}

.encoding-select {
    padding: 0.375rem 0.75rem;
    border: 1px solid #cbd5e0;
    border-radius: 0.25rem;
    background-color: white;
    color: #2d3748;
    font-size: 0.875rem;
    line-height: 1.25rem;
    min-width: 12rem;
}

.preview-table-wrapper {
    overflow-x: auto;
    max-height: 400px;
    overflow-y: auto;
}

.preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}

.row-number-cell {
    width: 2rem;
    text-align: center;
    color: #a0aec0;
    font-weight: normal;
    background-color: #f8fafc;
    border-right: 1px solid #e2e8f0;
}

.header-cell {
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    color: #4a5568;
    background-color: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
    position: sticky;
    top: 0;
    z-index: 10;
}

.data-row:nth-child(even) {
    background-color: #f8fafc;
}

.data-cell {
    padding: 0.5rem 1rem;
    border-bottom: 1px solid #e2e8f0;
    color: #2d3748;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.encoding-issue {
    background-color: #fff5f5;
    color: #c53030;
}

.preview-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: #f8fafc;
    border-top: 1px solid #e2e8f0;
}

.preview-info {
    font-size: 0.875rem;
    color: #4a5568;
}

.preview-buttons {
    display: flex;
    gap: 0.5rem;
}

.preview-button {
    padding: 0.25rem 0.75rem;
    background-color: white;
    border: 1px solid #cbd5e0;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    cursor: pointer;
    color: #4a5568;
}

.preview-button:hover:not(:disabled) {
    background-color: #edf2f7;
}

.preview-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.encoding-note {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: #fffbea;
    border-top: 1px solid #fbd38d;
    font-size: 0.875rem;
    color: #744210;
}

.warning-icon {
    fill: #d69e2e;
    margin-right: 0.5rem;
    flex-shrink: 0;
}
</style>