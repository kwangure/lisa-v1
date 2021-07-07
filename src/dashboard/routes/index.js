export default [
    {
        path: "/",
        component: () => import("./index.svelte"),
    },
];

export const error = () => import("./_error.svelte");
export const layout = () => import("./_layout.svelte");
