<template>
    <div class="csv-processor-example">
        <h1>CSV Processor Complete Example</h1>
        <p class="description">
            Import CSV data with international character support, column mapping, and encoding selection.
        </p>

        <VueCsvProcessor v-model="processedData" :fields="fields" :autoMatch="true" :defaultEncoding="selectedEncoding">
            <!-- Step 1: Upload Section -->
            <div class="section upload-section">
                <h2>1. Upload CSV File</h2>
                <p class="hint">
                    Drag and drop a CSV file or click to browse. Supports all character sets and encodings.
                </p>
                <VueCsvInput name="csv-file" accept=".csv" :maxSize="10 * 1024 * 1024" />

                <div class="header-toggle-wrapper">
                    <VueCsvToggleHeaders />
                </div>

                <VueCsvErrors />
            </div>

            <!-- Step 2: Preview Section -->
            <template v-if="hasFile">
                <div class="section preview-section">
                    <h2>2. Preview Data</h2>
                    <p class="hint">
                        If special characters don't display correctly, try selecting a different encoding.
                    </p>

                    <VueCsvPreview v-model:encoding="selectedEncoding" :rowCount="10" :showRowNumbers="true" />
                </div>

                <!-- Step 3: Mapping Section -->
                <div class="section mapping-section">
                    <h2>3. Map Columns</h2>
                    <p class="hint">
                        Match each field to the corresponding CSV column. Required fields are marked with an asterisk
                        (*).
                    </p>
                    <VueCsvMap :autoMatchIgnoreCase="true" />
                </div>

                <!-- Step 4: Process Section -->
                <div class="section process-section">
                    <h2>4. Process Data</h2>
                    <p class="hint" v-if="hasMissingRequiredMappings">
                        You must map all required fields before processing.
                    </p>
                    <button class="process-button" @click="processData"
                        :disabled="hasMissingRequiredMappings || isProcessing">
                        <span v-if="isProcessing">Processing...</span>
                        <span v-else>Process {{ processedData.length }} Records</span>
                    </button>
                </div>
            </template>
        </VueCsvProcessor>

        <!-- Results Section -->
        <div v-if="results.length > 0" class="section results-section" ref="resultsSection">
            <h2>5. Results</h2>
            <div class="results-info">
                <div class="info-item">
                    <span class="info-label">Total records:</span>
                    <span class="info-value">{{ results.length }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Encoding used:</span>
                    <span class="info-value">{{ selectedEncoding }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Required fields:</span>
                    <span class="info-value">
                        {{ Object.entries(fields).filter(([, config]) => config.required).map(([key]) => key).join(', ')
                        }}
                    </span>
                </div>
            </div>

            <!-- Results Table -->
            <div class="results-table-wrapper">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th class="row-number">#</th>
                            <th v-for="(field, key) in fields" :key="key" class="field-header">
                                {{ field.label || key }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, index) in results.slice(0, maxDisplayRows)" :key="index">
                            <td class="row-number">{{ index + 1 }}</td>
                            <td v-for="(field, key) in fields" :key="key" class="field-cell">
                                {{ row[key] || '-' }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination for large datasets -->
            <div v-if="results.length > maxDisplayRows" class="results-pagination">
                <p>
                    Showing {{ maxDisplayRows }} of {{ results.length }} records.
                    <button @click="exportData" class="export-button">
                        Export All Data
                    </button>
                </p>
            </div>
        </div>
    </div>
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick } from 'vue';
import {
    VueCsvProcessor,
    VueCsvInput,
    VueCsvToggleHeaders,
    VueCsvPreview,
    VueCsvMap,
    VueCsvErrors
} from '../src/index';

export default defineComponent({
    name: 'CompleteExample',

    components: {
        VueCsvProcessor,
        VueCsvInput,
        VueCsvToggleHeaders,
        VueCsvPreview,
        VueCsvMap,
        VueCsvErrors
    },

    setup() {
        // State
        const processedData = ref([]);
        const selectedEncoding = ref('UTF-8');
        const results = ref([]);
        const isProcessing = ref(false);
        const hasFile = ref(false);
        const resultsSection = ref(null);
        const maxDisplayRows = ref(50);

        // Field definitions
        const fields = {
            name: {
                required: true,
                label: 'Full Name'
            },
            email: {
                required: true,
                label: 'Email Address'
            },
            phone: {
                required: false,
                label: 'Phone Number'
            },
            country: {
                required: false,
                label: 'Country'
            },
            city: {
                required: false,
                label: 'City'
            },
            joinDate: {
                required: false,
                label: 'Join Date'
            },
            status: {
                required: false,
                label: 'Status'
            }
        };

        // Check if all required fields are mapped
        const hasMissingRequiredMappings = computed(() => {
            if (!processedData.value.length) return true;

            // Check if any required field is empty in the first row
            const firstRow = processedData.value[0];
            return Object.entries(fields).some(([key, config]) => {
                return config.required && (!firstRow[key] || firstRow[key].trim() === '');
            });
        });

        // Watch for changes in processedData to detect when a file is loaded
        watch(processedData, (newData) => {
            hasFile.value = newData.length > 0;
        });

        // Process the data
        const processData = async () => {
            if (hasMissingRequiredMappings.value) return;

            isProcessing.value = true;

            try {
                // Simulate processing delay
                await new Promise(resolve => setTimeout(resolve, 800));

                // In a real application, you'd process the data here,
                // possibly sending it to an API or performing transformations
                results.value = [...processedData.value];

                // Scroll to results section after processing
                await nextTick();
                if (resultsSection.value) {
                    resultsSection.value.scrollIntoView({ behavior: 'smooth' });
                }
            } catch (error) {
                console.error('Error processing data:', error);
                alert('An error occurred while processing the data. Please try again.');
            } finally {
                isProcessing.value = false;
            }
        };

        // Export data as JSON
        const exportData = () => {
            const dataStr = JSON.stringify(results.value, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

            const exportFileName = `csv-data-export-${new Date().toISOString().substring(0, 10)}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileName);
            linkElement.click();
        };

        return {
            processedData,
            selectedEncoding,
            fields,
            results,
            isProcessing,
            hasFile,
            hasMissingRequiredMappings,
            resultsSection,
            maxDisplayRows,
            processData,
            exportData
        };
    }
});
</script>

<style scoped>
.csv-processor-example {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #2c3e50;
    line-height: 1.5;
}

h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: #2c3e50;
}

.description {
    color: #666;
    margin-bottom: 2rem;
    font-size: 1.1rem;
}

.section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
    font-size: 1.25rem;
    margin-top: 0;
    margin-bottom: 1rem;
    color: #2c3e50;
    display: flex;
    align-items: center;
}

.hint {
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 1rem;
    font-style: italic;
}

.header-toggle-wrapper {
    margin-top: 1rem;
}

.process-button {
    padding: 0.75rem 1.5rem;
    background-color: #4299e1;
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    min-width: 200px;
}

.process-button:hover:not(:disabled) {
    background-color: #3182ce;
}

.process-button:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
}

.results-section {
    margin-top: 3rem;
    border-top: 2px solid #e2e8f0;
    padding-top: 2rem;
}

.results-info {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    background-color: #f8fafc;
    padding: 1rem;
    border-radius: 0.375rem;
}

.info-item {
    display: flex;
    align-items: center;
}

.info-label {
    font-weight: 600;
    margin-right: 0.5rem;
    color: #4a5568;
}

.info-value {
    color: #2d3748;
}

.results-table-wrapper {
    overflow-x: auto;
    margin-bottom: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
}

.results-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    overflow: hidden;
}

.results-table th {
    padding: 0.75rem 1rem;
    text-align: left;
    background-color: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
    font-weight: 600;
    color: #4a5568;
    position: sticky;
    top: 0;
}

.row-number {
    width: 3rem;
    text-align: center;
    color: #a0aec0;
    background-color: #f8fafc;
}

.field-header {
    min-width: 150px;
}

.results-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e2e8f0;
    color: #2d3748;
}

.results-table tr:hover {
    background-color: #f8fafc;
}

.field-cell {
    word-break: break-word;
    max-width: 300px;
}

.results-pagination {
    display: flex;
    justify-content: flex-end;
    padding: 1rem 0;
    color: #4a5568;
    font-size: 0.875rem;
}

.export-button {
    margin-left: 1rem;
    padding: 0.375rem 0.75rem;
    background-color: #48bb78;
    color: white;
    border: none;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color 0.2s;
}

.export-button:hover {
    background-color: #38a169;
}

@media (max-width: 768px) {
    .csv-processor-example {
        padding: 1rem;
    }

    .results-info {
        flex-direction: column;
        gap: 0.5rem;
    }
}
</style>