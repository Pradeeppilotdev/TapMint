import { read, write } from './storage.js';
export function resolveTheme(saved, systemDark) {
  return saved==='light'||saved==='dark'?saved:systemDark?'dark':'light';
}
export function initTheme(onChange) {
  const system=matchMedia('(prefers-color-scheme: dark)'),button=document.querySelector('#theme-toggle');
  let preference=read('theme',null);
  function apply(){
    const theme=resolveTheme(preference,system.matches),dark=theme==='dark';
    document.documentElement.dataset.theme=theme;
    document.querySelector('meta[name="theme-color"]').content=dark?'#100D18':'#FFFFFF';
    button.setAttribute('aria-pressed',String(dark));
    button.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');
    button.title=dark?'Switch to light mode':'Switch to dark mode';
    button.querySelector('span').textContent=dark?'Light':'Dark';
    onChange();
  }
  button.addEventListener('click',()=>{preference=document.documentElement.dataset.theme==='dark'?'light':'dark';write('theme',preference);apply();});
  system.addEventListener('change',()=>{if(preference!=='light'&&preference!=='dark')apply();});
  apply();
}
