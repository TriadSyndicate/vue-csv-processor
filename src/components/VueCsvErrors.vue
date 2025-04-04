<!-- 
  Error display component for showing CSV parsing and validation errors
-->
<template>
    <div class="vue-csv-errors">
        <!-- Default UI -->
        <div v-if="!$slots.default">
            <div v-if="hasErrors" class="errors-container" role="alert">
                <div class="errors-header">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"
                        class="error-icon">
                        <path fill="none" d="M0 0h24v24H0z" />
                        <path
                            d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
                    </svg>
                    <span>{{ errorCount }} {{ errorCount === 1 ? 'error' : 'errors' }} found</span>
                </div>

                <ul class="errors-list">
                    <li v-for="(error, index) in errors" :key="index" class="error-item">
                        {{ error }}
                    </li>
                </ul>
            </div>
        </div>

        <!-- Custom UI via slot -->
        <slot v-else :errors="errors"></slot>
    </div>
</template>

<script>
import { defineComponent, inject, computed } from 'vue';

export default defineComponent({
    name: 'VueCsvErrors',

    setup() {
        // Connect to parent component
        const csvProcessor = inject('csvProcessor');

        // Get errors from parent
        const errors = computed(() => csvProcessor.errors.value || []);

        // Check if there are any errors
        const hasErrors = computed(() => errors.value.length > 0);

        // Count errors
        const errorCount = computed(() => errors.value.length);

        return {
            errors,
            hasErrors,
            errorCount
        };
    }
});
</script>

<style scoped>
.vue-csv-errors {
    margin-bottom: 1.5rem;
}

.errors-container {
    background-color: #fff5f5;
    border: 1px solid #fed7d7;
    border-radius: 0.375rem;
    overflow: hidden;
}

.errors-header {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: #feb2b2;
    color: #c53030;
    font-weight: 600;
}

.error-icon {
    fill: #c53030;
    margin-right: 0.5rem;
}

.errors-list {
    list-style: none;
    margin: 0;
    padding: 0.5rem 0;
}

.error-item {
    padding: 0.5rem 1rem;
    color: #c53030;
    font-size: 0.875rem;
    border-bottom: 1px solid #fed7d7;
}

.error-item:last-child {
    border-bottom: none;
}
</style>