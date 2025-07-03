export * from './general';
export * from './horizontal-line/horizontal-line';
export * from './vertical-line/vertical-line';
export * from './box/box';
export * from './trend-line/trend-line';
export * from './vertical-line/vertical-line';
export * from './vertical-span/vertical-span';
export * from './measure/measure';
export * from './volume-profile/volume-profile';

import { VolumeProfile } from './volume-profile/volume-profile';

// @ts-ignore
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.Lib = window.Lib || {};
  // @ts-ignore
  window.Lib.VolumeProfile = VolumeProfile;

  // DEBUG: глобальный перехват attachPrimitive
  // @ts-ignore
  try {
    // @ts-ignore
    const Handler = window.Handler || (window.require && window.require('./general/handler').Handler);
    if (Handler && Handler.prototype && Handler.prototype.series && Handler.prototype.series.attachPrimitive) {
      const origAttach = Handler.prototype.series.attachPrimitive;
      Handler.prototype.series.attachPrimitive = function(primitive: any) {
        // @ts-ignore
        console.log('[DEBUG] attachPrimitive called', primitive?.constructor?.name, primitive);
        return origAttach.call(this, primitive);
      };
    }
  } catch (e) { console.warn('DEBUG attachPrimitive patch failed', e); }
}