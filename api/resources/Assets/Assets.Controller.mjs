import { ResponseBody } from '@am92/express-utils'

import AssetsModel from './Assets.Model.mjs'

const AssetsController = {
  createAsset,
  getAllAssets,
  getAvailability
}

export default AssetsController

async function createAsset(request, response, next) {
  const { body } = request
  const data = await AssetsModel.createAsset(body)
  const responseBody = new ResponseBody(200, 'OK', data)
  response.body = responseBody
  process.nextTick(next)
}

async function getAllAssets(request, response, next) {
  const { body } = request
  const data = await AssetsModel.getAllAssets(body)
  const responseBody = new ResponseBody(200, 'OK', data)
  response.body = responseBody
  process.nextTick(next)
}

async function getAvailability(request, response, next) {
  const { query } = request
  const data = await AssetsModel.getAvailability(query)
  // .catch(err => {
  //   console.log(err)
  // })
  const responseBody = new ResponseBody(200, 'OK', data)
  response.body = responseBody
  process.nextTick(next)
}
