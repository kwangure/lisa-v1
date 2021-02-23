export default [
    {
        path: "/",
        component: () => import("./settings/focus.svelte"),
    },
    {
        path: "/settings/focus",
        component: () => import("./settings/focus.svelte"),
    },
    {
        path: "/settings/short-break",
        component: () => import("./settings/short-break.svelte"),
    },
    {
        path: "/settings/long-break",
        component: () => import("./settings/long-break.svelte"),
    },
    {
        path: "/appearance",
        component: () => import("./appearance.svelte"),
    },
];

export const error = () => import("./_error.svelte");
export const layout = () => import("./_layout.svelte");
