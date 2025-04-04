# vue-csv-processor
├── dist/                  # Built files (generated)
├── src/
│   ├── components/        # Vue components
│   │   ├── VueCsvProcessor.vue       # Main wrapper component
│   │   ├── VueCsvInput.vue           # File input with encoding detection
│   │   ├── VueCsvPreview.vue         # Data preview with encoding selection
│   │   ├── VueCsvToggleHeaders.vue   # Headers toggle
│   │   ├── VueCsvMap.vue             # Column mapping
│   │   └── VueCsvErrors.vue          # Error display
│   ├── utils/             # Utility functions
│   │   ├── csv-parser.js             # CSV parsing logic
│   │   └── encoding-detector.js      # Encoding detection
│   ├── index.js           # Package entry point
│   └── plugin.js          # Vue plugin definition
├── package.json           # Package manifest
├── vite.config.js         # Build configuration
├── tsconfig.json          # TypeScript configuration
├── README.md              # Documentation
└── LICENSE                # MIT License