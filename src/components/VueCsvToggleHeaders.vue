<!-- 
  Toggle component for setting whether CSV has headers
  Enables/disables first row as headers in processing
-->
<template>
    <div class="vue-csv-toggle-headers">
        <!-- Default UI -->
        <div v-if="!$slots.default" class="toggle-container">
            <input :id="toggleId" type="checkbox" :checked="hasHeaders" @change="toggle" class="toggle-checkbox"
                v-bind="checkboxAttributes" />
            <label :for="toggleId" class="toggle-label" v-bind="labelAttributes">
                {{ text.toggleHeaders }}
            </label>
        </div>

        <!-- Custom UI via slot -->
        <slot v-else :hasHeaders="hasHeaders" :toggle="toggle"></slot>
    </div>
</template>

<script>
import { defineComponent, inject, computed } from 'vue';

export default defineComponent({
    name: 'VueCsvToggleHeaders',

    props: {
        /**
         * HTML ID for the checkbox
         */
        toggleId: {
            type: String,
            default: 'csv-has-headers'
        },

        /**
         * Additional attributes to bind to the checkbox
         */
        checkboxAttributes: {
            type: Object,
            default: () => ({})
        },

        /**
         * Additional attributes to bind to the label
         */
        labelAttributes: {
            type: Object,
            default: () => ({})
        }
    },

    emits: ['toggle'],

    setup(props, { emit }) {
        // Connect to parent component
        const csvProcessor = inject('csvProcessor');

        // Get state from parent
        const hasHeaders = computed(() => csvProcessor.hasHeaders.value);
        const text = computed(() => csvProcessor.text);

        // Toggle headers
        const toggle = () => {
            csvProcessor.toggleHeaders();
            emit('toggle', !hasHeaders.value);
        };

        return {
            hasHeaders,
            text,
            toggle
        };
    }
});
</script>

<style scoped>
.vue-csv-toggle-headers {
    margin-bottom: 1rem;
}

.toggle-container {
    display: flex;
    align-items: center;
}

.toggle-checkbox {
    margin-right: 0.5rem;
    cursor: pointer;
}

.toggle-label {
    cursor: pointer;
    user-select: none;
    color: #2d3748;
    font-size: 0.875rem;
}
</style>