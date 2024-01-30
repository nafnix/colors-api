import {
  OpenAPIRoute,
  OpenAPIRouteSchema,
} from "@cloudflare/itty-router-openapi";
import { type Env } from "~/types";
import { fetchChinaColors } from "~/utils";
import { Str, Num } from "@cloudflare/itty-router-openapi";

const NAME = "中国";

export class ChinaColors extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ["Colors"],
    summary: `${NAME}传统色`,
    responses: {
      "200": {
        description: `返回${NAME}传统颜色列表`,
        schema: {
          colors: [
            {
              CMYK: {
                C: new Num({ example: 0 }),
                M: new Num({ example: 56 }),
                Y: new Num({ example: 27 }),
                K: new Num({ example: 1 }),
              },
              RGB: {
                R: new Num({ example: 241 }),
                G: new Num({ example: 147 }),
                B: new Num({ example: 156 }),
              },
              hex: new Str({ example: "#f1939c" }),
              name: new Str({ example: "春梅红" }),
              pinyin: new Str({ example: "CHUNMEIHONG" }),
            },
          ],
          lastUpdateAt: Date,
        },
      },
    },
  };

  async handle(
    request: Request,
    env: Env,
    context: any,
    data: Record<string, any>
  ) {
    const key = "cn";

    const bucket = env.colorsBucket;
    const r2Object = await bucket.get(key);
    if (r2Object) {
      const colors = await r2Object.json();
      return { colors, lastUpdateAt: r2Object.uploaded };
    }

    const colors = await fetchChinaColors();
    const lastUpdateAt = new Date();
    await bucket.put(key, colors);
    return { colors: JSON.parse(colors), lastUpdateAt };
  }
}
