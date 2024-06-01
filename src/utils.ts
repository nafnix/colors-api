import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
} from "@material/material-color-utilities";
import * as prettier from "prettier";

import prettierPluginTypeScript from "prettier/plugins/typescript";
import prettierPluginEstree from "prettier/plugins/estree";
/**
 * 将16进制颜色转为 RGB
 * @param hex #至少7位的16进制颜色值，示例: #000000
 * @returns [R, G, B]
 */
export function hexToRGB(hex: string): [number, number, number] {
  const parseHex = (hexValue: string) => parseInt(`0x${hexValue}`);
  const r = parseHex(hex.slice(1, 3));
  const g = parseHex(hex.slice(3, 5));
  const b = parseHex(hex.slice(5, 7));
  return [r, g, b];
}

/**
 * 将 RGB 颜色转为 CMYK 颜色。实验性功能
 * @param r R
 * @param g G
 * @param b B
 * @returns [C,M,Y,K]
 */
export function rgbToCMYK(
  r: number,
  g: number,
  b: number
): [number, number, number, number] {
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

/**
 * 获取中国传统色
 * @returns 中国传统色文本
 */
export async function fetchChinaColors() {
  const response = await fetch("http://zhongguose.com/colors.json");
  return await response.text();
}

/**
 * 获取日本传统色
 * @returns 日本传统色
 */
export async function fetchJapanColors() {
  const base_url = "https://nipponcolors.com/";
  const htmlResponse = await fetch(base_url);
  const htmlText = await htmlResponse.text();
  const cssResponse = await fetch(`${base_url}min/g=nipponcolors_css`);
  const cssText = await cssResponse.text();

  const colors = [];
  for (const matchObject of htmlText.matchAll(
    /\<li id\="(?<cls>col\d+)"><div><a[^>]*>(?<name>[^,]+), (?<pinyin>[^</a]+)/g
  )) {
    const { cls, name, pinyin } = matchObject.groups as {
      cls: string;
      name: string;
      pinyin: string;
    };

    const reg = new RegExp(
      `.${cls} a:hover{background-color:(?<hex>#[a-zA-Z0-9]+)`
    );
    const hex = cssText.match(reg)!.groups!.hex;
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
 * @param hex 16进制颜色值
 * @returns 16 进制颜色值
 */
export function m3ThemeFromHex(hex: string): CSSColorScheme {
  const theme = themeFromSourceColor(argbFromHex(hex));
  const result: any = {
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

function themeFromHex(hex: string) {
  /**
   * 颜色转换器
   * @param {string} hexColor 16 进制颜色值
   * @returns 能够接受透明度参数的 rgb 颜色
   */
  function colorTransform(hexColor: string): string {
    return `rgb(${hexToRGB(hexColor).join(" ")} / <alpha-value>)`;
  }

  const theme = themeFromSourceColor(argbFromHex(hex));
  const result: {
    [key: string]: string | { [key: string | number]: string };
  } = {
    source: hexFromArgb(theme.source),
  };

  for (const [name, value] of Object.entries(theme.schemes.light.toJSON())) {
    const hexValue = hexFromArgb(value);
    const color = colorTransform(hexValue);
    result[name] = color;
  }

  for (const [name, value] of Object.entries(theme.schemes.dark.toJSON())) {
    const hexValue = hexFromArgb(value);
    result[name + "Dark"] = colorTransform(hexValue);
  }

  for (const [colorName, palette] of Object.entries(theme.palettes)) {
    result[colorName] =
      colorName in result ? { DEFAULT: result[colorName] as string } : {};

    const colorMap = result[colorName] as { [key: string | number]: string };

    for (let num = 0; num <= 100; num++) {
      const hexValue = hexFromArgb(palette.tone(num));
      colorMap[num] = colorTransform(hexValue);
    }
  }
  const neutral = (num: number) => result["neutral"][num];
  const surfaceOther: { [key: string]: string } = {
    Dim: neutral(87),
    Bright: neutral(98),
    ContainerLowest: neutral(100),
    ContainerLow: neutral(96),
    Container: neutral(94),
    ContainerHigh: neutral(92),
    ContainerHighest: neutral(90),

    DimDark: neutral(6),
    BrightDark: neutral(24),
    ContainerLowestDark: neutral(4),
    ContainerLowDark: neutral(10),
    ContainerDark: neutral(12),
    ContainerHighDark: neutral(17),
    ContainerHighestDark: neutral(24),
  };
  for (const key in surfaceOther) {
    result[`surface${key}`] = surfaceOther[key];
  }

  return result;
}

/**
 * 根据 16 进制颜色值生成 TailwindCSS Material Design 3 颜色主题
 * @param {string} hex 16进制颜色值
 * @returns {Object}
 */
export function m3TailwindCSSThemeFromHex(hex: string) {
  return themeFromHex(hex);
}

export function m3UnoCSSThemeFromHex(hex: string) {
  const colors = themeFromHex(hex);

  const colorSelector = "(text|bg|border|outline|decoration|fill|stroke)";

  const themeName = "material";
  const name = "md3";

  const result = `
  import { definePreset } from 'unocss'

  export default definePreset(() => {
    const schemeAliasMap: { [key: string]: string } = {
      p: 'primary',
      s: 'secondary',
      t: 'tertiary',
      e: 'error',
      n: 'neutral',
      nv: 'neutralVariant',
    }

    const ${themeName} = ${JSON.stringify(colors, undefined, 2)}

    return {
      name: '${themeName}-preset',
      shortcuts: [
        [
          /^${name}-([a-zA-Z]+)-([a-zA-Z]+)(?:-(100|[1-9]\\d|\\d))?(?:\\/(100|[1-9]\\d|\\d))?$/,
          ([, selector, name, tone, opacity]) => {
            const color = name in schemeAliasMap ? schemeAliasMap[name] : name
            const list = [\`\${selector}-${themeName}-\${color}\`]
            if (tone)
              list[0] += \`-\${tone}\`
  
            if (\`\${color}Dark\` in ${themeName})
              list.push(\`dark:\${list[0]}Dark\`)
  
            return opacity
              ? list.map(i => \`\${i}/\${opacity}\`).join(' ')
              : list.join(' ')
          },
        ],
      ],
      autocomplete: {
        templates: [
          '${name}-<colorSelector>-$colors.${themeName}',
          '${name}-<colorSelector>-<schemeAlias>-<n0to100>',
        ],
        shorthands: {
          colorSelector: '${colorSelector}',
          n0to100: Array.from({ length: 101 }, (_, i) => i.toString()),
          schemeAlias: Object.keys(schemeAliasMap)
        },
      },
      theme: { colors: { ${themeName} } },
    }
  })`;
  return prettierTs(result);
}

function prettierTs(content: string) {
  return prettier.format(content, {
    parser: "typescript",
    plugins: [prettierPluginEstree, prettierPluginTypeScript],
  });
}
