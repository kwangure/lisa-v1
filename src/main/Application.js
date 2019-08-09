import loadRoutes from './routes'
import router from './router'
import mapRoutes from './mapRoutes'

export default class Application {
    constructor(){
        /**
         * A map of routes, keyed by a unique route name. Each route is an object
         * containing the following properties:
         *
         * - `path` The path that the route is accessed at.
         * - `component` The Mithril component to render when this route is active.
         *
         * @example
         * app.routes.home = {path: '/d/:id', component: IndexPage};
         *
         * @type {Object}
         * @public
         */
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