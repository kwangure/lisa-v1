import { reloadOnFileChange } from "./reload";

// eslint-disable-next-line no-constant-condition
if (import.meta.env.DEV) {
    reloadOnFileChange();
}
