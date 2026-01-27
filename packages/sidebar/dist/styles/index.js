// Side-effect entrypoint: lets consumers `import 'sveltekit-sidebar/styles'`
// without relying on Node to import a raw `.css` module during SSR.
import './index.css';
export {};
