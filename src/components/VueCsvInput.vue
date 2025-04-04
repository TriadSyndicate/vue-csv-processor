<!-- 
  File input component for selecting CSV files
  Handles file validation and triggers processing
-->
<template>
    <div class="vue-csv-input">
        <!-- Default file input UI -->
        <div v-if="!$slots.default">
            <div class="file-drop-area" :class="{ 'file-drop-active': isDragging, 'has-file': !!file }"
                @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave" @drop.prevent="onDrop">
                <input ref="fileInputRef" type="file" :name="name" :accept="accept" class="file-input"
                    @change="handleChange" :disabled="disabled" />

                <div class="file-content">
                    <div v-if="!file" class="file-placeholder">
                        <div class="file-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                <path fill="none" d="M0 0h24v24H0z" />
                                <path
                                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                            </svg>
                        </div>
                        <span>Drop CSV file here or click to browse</span>
                    </div>

                    <div v-else class="file-info">
                        <span class="file-name">{{ file.name }}</span>
                        <span class="file-size">({{ formatFileSize(file.size) }})</span>
                        <button class="remove-file" @click.prevent="removeFile">✕</button>
                    </div>
                </div>
            </div>

            <!-- Errors -->
            <div v-if="fileErrors.length" class="file-errors">
                <p v-for="(error, index) in fileErrors" :key="index" class="error-message">
                    {{ error }}
                </p>
            </div>
        </div>

        <!-- Custom UI via slot -->
        <slot v-else :file="file" :change="handleChange" :remove="removeFile" :errors="fileErrors"></slot>
    </div>
</template>

<script>
import { defineComponent, ref, inject, computed, onMounted, watch } from 'vue';

export default defineComponent({
    name: 'VueCsvInput',

    props: {
        /**
         * Input field name
         */
        name: {
            type: String,
            default: 'csv-file'
        },

        /**
         * Accepted file types
         */
        accept: {
            type: String,
            default: '.csv,text/csv,application/vnd.ms-excel,text/plain'
        },

        /**
         * Whether to perform validation
         */
        validation: {
            type: Boolean,
            default: true
        },

        /**
         * Allowed file MIME types
         */
        fileMimeTypes: {
            type: Array,
            default: () => [
                'text/csv',
                'text/x-csv',
                'application/vnd.ms-excel',
                'text/plain'
            ]
        },

        /**
         * Maximum file size in bytes
         */
        maxSize: {
            type: Number,
            default: 5 * 1024 * 1024 // 5MB
        },

        /**
         * Whether the input is disabled
         */
        disabled: {
            type: Boolean,
            default: false
        }
    },

    emits: ['change', 'error'],

    setup(props, { emit }) {
        // Connect to parent component
        const csvProcessor = inject('csvProcessor');

        // Local state
        const fileInputRef = ref(null);
        const isDragging = ref(false);
        const fileErrors = ref([]);

        // Get the file from the parent component
        const file = computed(() => csvProcessor.file.value);

        // Handle file selection
        const handleChange = async (event) => {
            const selectedFile = event.target.files?.[0] || null;

            if (!selectedFile) {
                return;
            }

            // Validate file
            if (props.validation) {
                fileErrors.value = validateFile(selectedFile);

                if (fileErrors.value.length > 0) {
                    emit('error', fileErrors.value);
                    return;
                }
            }

            try {
                // Set the file in the parent component
                await csvProcessor.setFile(selectedFile);
                emit('change', selectedFile);
            } catch (error) {
                fileErrors.value.push(`Error processing file: ${error.message}`);
                emit('error', fileErrors.value);
            }
        };

        // Remove the selected file
        const removeFile = () => {
            if (fileInputRef.value) {
                fileInputRef.value.value = '';
            }

            csvProcessor.setFile(null);
            fileErrors.value = [];
            emit('change', null);
        };

        // Validate the selected file
        const validateFile = (file) => {
            const errors = [];

            // Check file type
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const fileMimeType = file.type;

            if (
                !props.fileMimeTypes.includes(fileMimeType) &&
                fileExtension !== 'csv'
            ) {
                errors.push(csvProcessor.text.errors.invalidMimeType);
            }

            // Check file size
            if (file.size > props.maxSize) {
                errors.push(`File is too large. Maximum size is ${formatFileSize(props.maxSize)}.`);
            }

            return errors;
        };

        // Format file size for display
        const formatFileSize = (bytes) => {
            if (bytes === 0) return '0 Bytes';

            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        // Drag and drop handlers
        const onDragOver = (event) => {
            isDragging.value = true;
        };

        const onDragLeave = (event) => {
            isDragging.value = false;
        };

        const onDrop = (event) => {
            isDragging.value = false;

            const droppedFile = event.dataTransfer.files[0];
            if (!droppedFile) return;

            // Simulate file input change
            if (fileInputRef.value) {
                // Create a new FileList containing the dropped file
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(droppedFile);
                fileInputRef.value.files = dataTransfer.files;

                // Trigger the change handler
                handleChange({ target: fileInputRef.value });
            }
        };

        // Expose the file input ref to the parent component
        onMounted(() => {
            if (fileInputRef.value && csvProcessor) {
                csvProcessor.fileInputRef = fileInputRef;
            }
        });

        // Watch for errors from the parent component
        watch(() => csvProcessor.errors.value, (newErrors) => {
            if (newErrors && newErrors.length > 0) {
                fileErrors.value = newErrors;
            }
        });

        return {
            fileInputRef,
            file,
            isDragging,
            fileErrors,
            handleChange,
            removeFile,
            formatFileSize,
            onDragOver,
            onDragLeave,
            onDrop
        };
    }
});
</script>

<style scoped>
.vue-csv-input {
    margin-bottom: 1rem;
}

.file-drop-area {
    position: relative;
    padding: 2rem;
    border: 2px dashed #ccc;
    border-radius: 0.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 0.5rem;
}

.file-drop-area:hover {
    border-color: #aaa;
    background-color: #f9f9f9;
}

.file-drop-active {
    border-color: #4299e1;
    background-color: #ebf8ff;
}

.has-file {
    border-color: #48bb78;
    background-color: #f0fff4;
}

.file-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
}

.file-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.file-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #666;
}

.file-icon {
    width: 3rem;
    height: 3rem;
    margin-bottom: 0.5rem;
}

.file-icon svg {
    width: 100%;
    height: 100%;
    fill: #666;
}

.file-info {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
}

.file-name {
    font-weight: 600;
    margin-right: 0.25rem;
}

.file-size {
    color: #666;
}

.remove-file {
    margin-left: 0.5rem;
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 9999px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.remove-file:hover {
    background-color: #f2f2f2;
    color: #e53e3e;
}

.file-errors {
    margin-top: 0.5rem;
}

.error-message {
    color: #e53e3e;
    font-size: 0.875rem;
    margin: 0.25rem 0;
}
</style>