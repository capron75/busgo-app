import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./test-import-hook.mjs", pathToFileURL("./scripts/"));
