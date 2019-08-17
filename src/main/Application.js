import loadRoutes from './routes'
import router from './router'
import mapRoutes from './mapRoutes'

export default class Application {
    constructor(){
        this.routes = {};

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