import loadRoutes from './routes'
import router from './router'
import mapRoutes from '../main/mapRoutes'

export default class Application {
    constructor(){
        window.app = this
        
        this.routes = {}

        loadRoutes(this)

        //Register routes
        router({
            app: this,
            target: document.getElementById('application'),
            basePath: window.location.pathname,
            routes: mapRoutes(this.routes, ''),
        })
    }
}