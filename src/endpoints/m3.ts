import {
  OpenAPIRoute,
  OpenAPIRouteSchema,
  Query,
} from "@cloudflare/itty-router-openapi";
import {
  m3ThemeFromHex,
  m3TailwindCSSThemeFromHex,
  m3UnoCSSThemeFromHex,
} from "~/utils";
import { z } from "zod";

export class M3Colors extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ["Colors"],
    summary: "Material Design 3 主题生成",
    parameters: {
      hex: Query(String, {
        description: "16进制颜色",
        example: "#ffffff",
      }),
      type: Query(z.enum(["css", "tailwindcss", "unocss"]), {
        description: "返回颜色值类型",
      }),
      themeName: Query(String, {
        description: "主题名称(只有 type 值是 unocss 才可用)",
        required: false,
        default: "nafnix",
      }),
    },
    responses: {
      "200": {
        description:
          "Material Design 3 主题，如果 type 值是 unocss，则返回文件，否则是 JSON 格式。",
        // schema: new Str({ format: "binary" }),
        // schema: new Str(),
      },
    },
  };

  async handle(
    request: Request,
    env: Env,
    context: any,
    data: Record<
      "query",
      {
        hex: string;
        type: "css" | "tailwindcss" | "unocss";
        themeName: string;
      }
    >
  ) {
    const { hex, type, themeName } = data.query;

    switch (type) {
      case "css":
        return m3ThemeFromHex(hex);

      case "unocss":
        return new Response(await m3UnoCSSThemeFromHex(hex, themeName), {
          headers: {
            "Content-Type": "application/javascript; charset=UTF-8",
            "Content-Disposition": `attachment; filename=unocss-md3-${themeName}-preset.ts`,
          },
        });

      case "tailwindcss":
        return m3TailwindCSSThemeFromHex(hex);

      default:
        break;
    }
  }
}
