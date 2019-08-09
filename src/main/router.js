import page from 'page'

export default function router(data) {
    const { app, target, basePath, routes } = data
    
    page.base(basePath)

    for (const route in routes) {
        page(route, (ctx, next) => {
            app.previous = app.current
            if (app.current) app.current.$destroy()
            
            app.current = new routes[route]({
                target: target,
                props: ctx.params,
                hydrate: true,
            })
        })
    }

    //Go home on404
    page('*', function(ctx){
        console.error(`Error 404: ${ctx.path} Not Found`)
        page('/')
    })

    page({})
}