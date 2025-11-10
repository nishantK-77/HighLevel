import { configureRouter } from '@am92/express-utils'

import AssetsController from './Assets.Controller.mjs'

const { createAsset, getAllAssets, getAvailability } = AssetsController

const masterConfig = {
  routerName: 'Assets',
  // preMiddlewares: [validateApiKey, validateToken],
  postMiddlewares: [],
  routesConfig: {
    createAsset: {
      method: 'post',
      path: '/create',
      pipeline: [createAsset]
    },
    getAllAssets: {
      method: 'get',
      path: '/get-all-assets',
      pipeline: [getAllAssets]
    },
    getAvailability: {
      method: 'get',
      path: '/get-availability',
      pipeline: [getAvailability]
    }
  }
}

export default class AssetsRouter {
  constructor(Router, customConfig) {
    const resourceRouter = configureRouter(Router, masterConfig, customConfig)
    return resourceRouter
  }
}
