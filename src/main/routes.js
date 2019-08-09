import Pomodoro from './routes/Pomodoro.svelte'
import Profile from './routes/Profile.svelte'

export default function (app) {
    app.routes = {
        'index': { 
            path: '/', 
            component: Pomodoro
        },
        'profile': {
            path: '/profile', 
            component: Profile
        },
    }
}