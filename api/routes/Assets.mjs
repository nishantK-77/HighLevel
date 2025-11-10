import Express from 'express'

import AssetsRouter from '../resources/Assets/Assets.Router.mjs'

const config = {
  routesConfig: {
    createAsset: { enabled: true },
    getAllAssets: { enabled: true },
    getAvailability: { enabled: true }
  }
}

const Router = new Express.Router()
const assetsRouter = new AssetsRouter(Router, config)

export default assetsRouter
