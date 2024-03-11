import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
} from "@material/material-color-utilities";

/**
 *  将16进制颜色转为 RGB
 * @param {string} hex 16进制颜色值，示例: #000000
 * @returns [R, G, B]
 */
export function hexToRGB(hex) {
  const parseHex = (hexValue) => parseInt(`0x${hexValue}`);
  const r = parseHex(hex.slice(1, 3));
  const g = parseHex(hex.slice(3, 5));
  const b = parseHex(hex.slice(5, 7));
  return [r, g, b];
}

/**
 * 将 RGB 颜色转为 CMYK 颜色。实验性功能
 * @param {number} r R
 * @param {number} g G
 * @param {number} b B
 * @returns [C,M,Y,K]
 */
export function rgbToCMYK(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  let k = Math.min(1 - r, 1 - g, 1 - b);
  let c = (1 - r - k) / (1 - k);
  let m = (1 - g - k) / (1 - k);
  let y = (1 - b - k) / (1 - k);

  c = Math.round(c * 100);
  m = Math.round(m * 100);
  y = Math.round(y * 100);
  k = Math.round(k * 100);

  return [c, m, y, k];
}

export async function fetchChinaColors() {
  const response = await fetch("http://zhongguose.com/colors.json");
  return await response.text();
}

export async function fetchJapanColors() {
  // async function getCMYK(pinyin) {
  //   const response = await fetch("https://nipponcolors.com/php/io.php", {
  //     headers: {
  //       "content-type": "application/x-www-form-urlencoded",
  //     },
  //     body: `color=${pinyin}`,
  //     method: "POST",
  //   });
  //   const data = await response.json();
  //   const cmyk = data.cmyk;
  //   return [
  //     parseInt(cmyk.slice(0, 3)),
  //     parseInt(cmyk.slice(3, 6)),
  //     parseInt(cmyk.slice(6, 9)),
  //     parseInt(cmyk.slice(9, 12)),
  //   ];
  // }

  const base_url = "https://nipponcolors.com/";
  const htmlResponse = await fetch(base_url);
  const htmlText = await htmlResponse.text();
  const cssResponse = await fetch(`${base_url}min/g=nipponcolors_css`);
  const cssText = await cssResponse.text();

  const colors = [];
  for (const matchObject of htmlText.matchAll(
    /\<li id\="(?<cls>col\d+)"><div><a[^>]*>(?<name>[^,]+), (?<pinyin>[^</a]+)/g
  )) {
    const { cls, name, pinyin } = matchObject.groups;

    const reg = new RegExp(
      `.${cls} a:hover{background-color:(?<hex>#[a-zA-Z0-9]+)`
    );
    const hex = cssText.match(reg).groups.hex;
    const RGB = hexToRGB(hex);
    // const CMYK = await getCMYK(pinyin);
    colors.push({
      // CMYK,
      RGB,
      hex,
      name,
      pinyin,
    });
  }
  return JSON.stringify(colors);
}

/**
 * 根据 16 进制颜色值生成 16 进制颜色值的 Material Design 3 颜色主题
 * @param {string} hex 16进制颜色值
 * @returns {Object}
 */
export function m3ThemeFromHex(hex) {
  const theme = themeFromSourceColor(argbFromHex(hex));
  const result = {
    source: hexFromArgb(theme.source),
    schemes: {},
    palettes: {},
  };

  for (const [schemeName, scheme] of Object.entries(theme.schemes)) {
    result.schemes[schemeName] = {};

    for (const [varName, varValue] of Object.entries(scheme.toJSON())) {
      result.schemes[schemeName][varName] = hexFromArgb(varValue);
    }
  }

  for (const [colorName, palette] of Object.entries(theme.palettes)) {
    result.palettes[colorName] = {};
    for (let num = 0; num <= 100; num++) {
      result.palettes[colorName][num] = hexFromArgb(palette.tone(num));
    }
  }

  return result;
}

/**
 * 根据 16 进制颜色值生成 TailwindCSS Material Design 3 颜色主题
 * @param {string} hex 16进制颜色值
 * @returns {Object}
 */
export function m3TailwindCSSThemeFromHex(hex) {
  /**
   * 颜色转换器
   * @param {string} hexColor 16 进制颜色值
   * @returns 能够接受透明度参数的 rgb 颜色
   */
  function colorTransform(hexColor) {
    return `rgb(${hexToRGB(hexColor).join(' ')} / <alpha-value>)`;
  }

  /**
   * 名称转换器
   * @param {string} name 名称
   * @returns 将驼峰名称中的大写转为小写，并在其前加个 -
   */
  function nameTransform(name) {
    return name.replace(/([A-Z])/g, "-$1").toLowerCase()
  }

  const theme = themeFromSourceColor(argbFromHex(hex));
  const result = {
    source: hexFromArgb(theme.source),
  };

  for (let [varName, varValue] of Object.entries(theme.schemes.light.toJSON())) {
    const hexValue = hexFromArgb(varValue);
    const color = colorTransform(hexValue)
    varName = nameTransform(varName);
    result[varName] = color;
  }

  for (let [varName, varValue] of Object.entries(theme.schemes.dark.toJSON())) {
    const hexValue = hexFromArgb(varValue);
    varName = nameTransform(varName);
    result[`${varName}-dark`] = colorTransform(hexValue);
  }

  for (let [colorName, palette] of Object.entries(theme.palettes)) {
    for (let num = 1; num <= 100; num++) {
      const hexValue = hexFromArgb(palette.tone(num));
      colorName = nameTransform(colorName);
      result[`${colorName}-${num}`] = colorTransform(hexValue);
    }
  }

  return result;
}
