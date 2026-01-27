// Docs app only:
// Import sidebar styles from source to avoid SSR trying to load a raw `.css` file
// via package exports (which Node cannot import).
import '../../../../packages/sidebar/src/lib/styles/index.css';

export {};

