
// css-color -> {r,g,b,a} via offscreen element + getComputedStyle
function cssColorToRgba(color) {
  if (!color) return null;
  const el = document.createElement('span');
  el.style.color = color;
  // the element must be in the DOM for getComputedStyle to be reliable
  document.body.appendChild(el);
  const cs = getComputedStyle(el).color; // "rgb(r, g, b)" or "rgba(r, g, b, a)"
  document.body.removeChild(el);

  const m = cs.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/i);
  if (!m) return null;
  const [, r, g, b, a] = m;
  return { r: +r, g: +g, b: +b, a: a !== undefined ? +a : 1 };
}

function rgbaToHex({r,g,b,a=1}) {
  const h = x => x.toString(16).padStart(2,'0');
  // We ignore a in hex; however, CSS variables can also be assigned rgba().
  return `#${h(r)}${h(g)}${h(b)}`;
}

function rgbToHsl({r,g,b}) {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0, s=0, l=(max+min)/2;
  if (max !== min) {
    const d = max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch (max) {
      case r: h=(g-b)/d + (g<b?6:0); break;
      case g: h=(b-r)/d + 2; break;
      case b: h=(r-g)/d + 4; break;
    }
    h/=6;
  }
  return { h, s, l };
}

function hslToRgb({h,s,l}) {
  let r,g,b;
  if (s === 0) { r=g=b=l; }
  else {
    const q = l < .5 ? l*(1+s) : l + s - l*s;
    const p = 2*l - q;
    const hue = t=>{
      if (t<0) t+=1;
      if (t>1) t-=1;
      if (t<1/6) return p + (q-p)*6*t;
      if (t<1/2) return q;
      if (t<2/3) return p + (q-p)*(2/3 - t)*6;
      return p;
    };
    r = hue(h+1/3); g = hue(h); b = hue(h-1/3);
  }
  return { r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) };
}

// Shift brightness (L) by delta; negative delta = darker
function shadeCssColor(baseColor, deltaL) {
  const rgba = cssColorToRgba(baseColor);
  if (!rgba) return baseColor; // Fallback: unverändert
  const hsl = rgbToHsl(rgba);
  hsl.l = Math.min(1, Math.max(0, hsl.l + deltaL));
  const rgb = hslToRgb(hsl);
  // Wenn die Eingabe alpha hatte, könntest du hier auch rgba(...) zurückgeben.
  return rgbaToHex(rgb); // hex ist hier am zuverlässigsten
}

// --- NEU: WCAG-Helpers ---
function srgbToLinear(c01) {
  // c01: 0..1
  return (c01 <= 0.03928) ? (c01 / 12.92) : Math.pow((c01 + 0.055) / 1.055, 2.4);
}
function relativeLuminance({r, g, b}) {
  const R = srgbToLinear(r / 255);
  const G = srgbToLinear(g / 255);
  const B = srgbToLinear(b / 255);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(L1, L2) {
  const [hi, lo] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

// --- NEU: Textfarbe bestimmen (#000 oder #fff) ---
function pickTextColorForBackgroundColor(baseCssColor, weight = 0.35) {
  if (!baseCssColor) return '#000';
  const rgba = cssColorToRgba(baseCssColor);
  if (!rgba) return '#000'; // konservativer Fallback

  const Lbg = relativeLuminance(rgba);
  const contrastToWhite = contrastRatio(1.0, Lbg);
  const contrastToBlack = contrastRatio(Lbg, 0.0);


  weight = (typeof weight !== 'number') ?
      0.5 :
      Math.max(Math.min(weight, 1), 0);

  return (weight * contrastToBlack >= (1 - weight) * contrastToWhite) ? '#000' : '#fff';
}

// public API: derive variants from any CSS colour
function deriveColors(baseCssColor) {
  return {
    color: baseCssColor,                               // Original
    colorHover: shadeCssColor(baseCssColor, -0.08),    // slightly darker
    color_progress: shadeCssColor(baseCssColor, -0.28), // significantly darker
    textColor: pickTextColorForBackgroundColor(baseCssColor),
  };
}

export { deriveColors };