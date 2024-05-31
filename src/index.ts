import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { ChinaColors } from "./endpoints/cn";
import { JapanColors } from "./endpoints/jp";
import { M3Colors } from "./endpoints/m3";
import { fetchChinaColors, fetchJapanColors } from "~/utils";

export const router = OpenAPIRouter({
  docs_url: "/",
});

router.get("/cn/", ChinaColors);
router.get("/jp/", JapanColors);
router.get("/m3/", M3Colors);

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
