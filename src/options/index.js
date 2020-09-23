import root from "./_root.svelte";
import routes from "./routes/index.js";
import router from "@deimimi/svelte-pagejs-router";
import "@deimimi/strawberry/css/shared.css";

router(root, routes, { hashbang: true });