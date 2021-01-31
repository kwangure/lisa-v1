export default [
    {
        path: "/",
        component: () => import("./index.svelte"),
    },
    {
        path: "/appearance",
        component: () => import("./appearance.svelte"),
    },
];
