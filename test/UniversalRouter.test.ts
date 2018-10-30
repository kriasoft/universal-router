import UniversalRouter from '../src/UniversalRouter'

new UniversalRouter({
  path: '/users',
  children: [
    {
      path: '',
      action: () => 'Users',
    },
    {
      path: '/:username',
      action(context, params) {
        console.log(context.search)
        return `Profile ${params.username}`
      },
    },
  ],
})
  .resolve({ pathname: '/users/john', search: '?busy=1' })
  .then(console.log)

new UniversalRouter(
  {
    name: 'root',
    action: (context) => context.path,
  },
  {
    context: {
      user: 'name',
    },
    baseUrl: '/base',
    resolveRoute(context, params) {
      if (typeof context.route.action === 'function') {
        return context.route.action(context, params)
      }
      return undefined
    },
    errorHandler: (error, context) => {
      console.error(error)
      console.log(context.pathname, context.user)
      return error.status === 404 ? 'Not Found' : 'Something went wrong'
    },
  },
)
  .resolve('/')
  .then(console.log)

new UniversalRouter([
  {
    async action({ next }) {
      console.log('middleware: start')
      const child = await next()
      console.log('middleware: end')
      return child
    },
    children: [
      {
        path: '/hello',
        action() {
          console.log('route: return a result')
          return { foo: 'bar' }
        },
      },
    ],
  },
])
  .resolve('/hello')
  .then((result) => console.log(result.foo))
