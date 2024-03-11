import {
  OpenAPIRoute,
  OpenAPIRouteSchema,
  Query,
  Enumeration,
} from "@cloudflare/itty-router-openapi";
import { type Env } from "~/types";
import { m3ThemeFromHex, m3TailwindCSSThemeFromHex } from "~/utils";
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
    },
    responses: {
      "200": {
        description: "JSON 格式的 Material Design 3 主题",
      },
    },
  };

  async handle(
    request: Request,
    env: Env,
    context: any,
    data: Record<
      "query",
      { hex: string; type: "css" | "tailwindcss" | "unocss" }
    >
  ) {
    const { hex, type } = data.query;

    switch (type) {
      case "css":
        return m3ThemeFromHex(hex);

      case "unocss":
      case "tailwindcss":
        return m3TailwindCSSThemeFromHex(hex);

      default:
        break;
    }
  }
}
