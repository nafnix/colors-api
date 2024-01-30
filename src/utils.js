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
