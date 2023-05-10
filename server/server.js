/* Consigna: 
----------------------------------------------------------------------------------

-----------------------------------------------------------------------------------------
*/

const { config, staticFiles } = require('../config/environment')
const { logger, loggererr } = require('../log/logger')

//------------------------------------------------------------------------------


  //--- Servicios KOA
  const Koa = require('koa')
  const session = require('koa-session')
  const passport = require('../middlewares/auth');
  const http = require('http')
  const IO = require('socket.io')
  
  const app = new Koa()
  const server = http.createServer(app.callback())
  const io = IO(server)
  

  //--- Routes
  const productRouter = require('../routes/productRouter')
  const sessionRouter = require('../routes/sessionRouter')
  const infoRouter = require('../routes/infoRouter')

  //--- Objetos locales
  const { newProductController, getAllProductsController } = require('../controllers/productsController')
  const { getAllChatsController, addChatMsgController } = require('../controllers/chatsController')
 

  //--- Middlewares
  app.use(require('koa-bodyparser')())
  app.use(require('koa-static')(staticFiles))
  app.keys = ['secret-pin']
  app.use(session({}, app))
  app.use(passport.initialize())
  app.use(passport.session())


  
  //--- SOCKET
  io.on('connection', async socket => {
    console.log('Nuevo cliente conectado!')

    //-- Tabla inicial al cliente
    socket.emit('productos', await getAllProductsController())
 
    //-- Nuevo producto desde cliente
    socket.on('update', async producto => {
      await newProductController( producto )
      io.sockets.emit('productos', await getAllProductsController())
    })
  
    //-- Chat inicial al cliente
    socket.emit('mensajes', await getAllChatsController())

    //-- Nuevo mensaje desde el cliente
    socket.on('newMsj', async mensaje => {
      mensaje.date = new Date().toLocaleString()
      await addChatMsgController( mensaje ) 
      io.sockets.emit('mensajes', await getAllChatsController())
    })

  })


  const Router = require('koa-router')
  const router = new Router()
  
  //--- ROUTES
  //--- SESSION ROUTER 
  router.use('/session', sessionRouter.routes(), sessionRouter.allowedMethods())
  
  //--- API REST ROUTER 
  router.use('/api', productRouter.routes(), productRouter.allowedMethods())
  
  //--- INFO ROUTER
  router.use('/info', infoRouter.routes(), infoRouter.allowedMethods())
  
  //--- Rutas no implementadas
  app.use(async (ctx, next) => {
    logger.warn(`Ruta: ${ctx.url}, metodo: ${ctx.method} no implemantada`)
    ctx.body = `Ruta: ${ctx.url}, metodo: ${ctx.method} no implemantada`
    await next();
  })
  
  app.use(router.routes())
  app.use(router.allowedMethods())
  
  //--- SERVER ON
  let PORT = (config.port) ? config.port : 8080 // puerto por defecto 8080
  
  if (config.mode === 'CLUSTER') { // para CLUSTER si la clave same es 1 crea un puerto para cada worker
    PORT = config.same === 1 ? PORT + cluster.worker.id - 1 : PORT
  }
  
  server.listen(PORT, () => {
    console.log(`Servidor http escuchando en el puerto ${PORT}`)
  })
  server.on('error', error => loggererr.error(`Error en servidor ${error}`))
  

//------------------------------ PROCESO BASE FIN -----------------------------------  
//-----------------------------------------------------------------------------------



//---------------------------- LOGICA CLUSTER / FORK  -------------------------------






