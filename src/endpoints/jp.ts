import {
  OpenAPIRoute,
  OpenAPIRouteSchema,
} from "@cloudflare/itty-router-openapi";
import { fetchJapanColors } from "~/utils";
import { Str, Num } from "@cloudflare/itty-router-openapi";

const NAME = "日本";

export class JapanColors extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ["Colors"],
    summary: `${NAME}传统色`,
    responses: {
      "200": {
        description: `返回${NAME}传统颜色列表`,
        schema: {
          colors: [
            {
              RGB: {
                R: new Num({ example: 220 }),
                G: new Num({ example: 159 }),
                B: new Num({ example: 180 }),
              },
              hex: new Str({ example: "#DC9FB4" }),
              name: new Str({ example: "撫子" }),
              pinyin: new Str({ example: "NADESHIKO" }),
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
    const key = "jp";

    const bucket = env.colorsBucket;
    const r2Object = await bucket.get(key);
    if (r2Object) {
      const colors = await r2Object.json();
      return { colors, lastUpdateAt: r2Object.uploaded };
    }

    const colors = await fetchJapanColors();
    const lastUpdateAt = new Date();
    await bucket.put(key, colors);
    return { colors: JSON.parse(colors), lastUpdateAt };
  }
}
