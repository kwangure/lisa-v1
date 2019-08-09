import Settings from './routes/Settings.svelte'
import History from './routes/History.svelte'

export default function (app) {
    app.routes = {
        'index': { 
            path: '/', 
            component: Settings
        },
        'profile': {
            path: '/profile', 
            component: History
        },
    }
}