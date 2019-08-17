import Pomodoro from './routes/Pomodoro.svelte'

export default function (app) {
    app.routes = {
        'index': { 
            path: '/', 
            component: Pomodoro
        },
    }
}