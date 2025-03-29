/**
 * @deprecated This service file is deprecated.
 * Please import from '@/services/property' instead.
 */

// Fix circular dependency by using relative path instead of alias
export * from '../../services/property';
export { default } from '../../services/property';

// NOTE: All client code should migrate to use the new implementation
// from '@/services/property' directly. This file will be removed in a future update. 