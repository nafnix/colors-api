import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { ChinaColors } from "./endpoints/cn";
import { JapanColors } from "./endpoints/jp";
import { fetchChinaColors, fetchJapanColors } from "~/utils";
import { type Env } from "~/types";

export const router = OpenAPIRouter({
  docs_url: "/",
});

router.get("/cn/", ChinaColors);
router.get("/jp/", JapanColors);

// 404 for everything else
router.all("*", () =>
  Response.json(
    {
      success: false,
      error: "Route not found",
    },
    { status: 404 }
  )
);

export default {
  fetch: router.handle,

  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    await env.colorsBucket.put("cn", await fetchChinaColors());
    await env.colorsBucket.put("jp", await fetchJapanColors());
  },
};
