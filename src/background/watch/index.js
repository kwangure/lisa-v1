import { reloadOnFileChange } from "./reload";

if(import.meta.env.DEV) {
    reloadOnFileChange();
}