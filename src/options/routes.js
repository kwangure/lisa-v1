import Settings from './routes/Settings.svelte'

export default function (app) {
    app.routes = {
        'index': { 
            path: '/', 
            component: Settings
        },
    }
}