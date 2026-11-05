// Allow importing style files as side-effects in TypeScript
// This prevents errors like "Cannot find module or type declarations for side-effect import of '.../index.css'".

declare module '*.css';
declare module '*.scss';
declare module '*.sass';
declare module '*.less';

// Specific explicit module if needed
declare module '@photo-sphere-viewer/core/index.css';
