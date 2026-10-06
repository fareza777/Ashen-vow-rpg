import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const colors={ink:'#100e11',bone:'#f2e9d9',gold:'#c6a06d',ember:'#b94b38'};
export const serif='Ashen Cinzel';
export const sans='Ashen Manrope';
export const fontReady=Promise.all([
  loadFont({family:serif,url:staticFile('fonts/cinzel-600.woff2'),weight:'600'}),
  loadFont({family:sans,url:staticFile('fonts/manrope-400.woff2'),weight:'400'}),
  loadFont({family:sans,url:staticFile('fonts/manrope-600.woff2'),weight:'600'}),
]);
