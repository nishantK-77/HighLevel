import { ResponseBody } from '@am92/express-utils'

import AppointmentsModel from './Appointments.Model.mjs'

const AppointmentsController = {
  createAppointment,
  createAppointmentException,
  getAllAppointments
}

async function createAppointment(request, response, next) {
  const { body } = request
  const data = await AppointmentsModel.createAppointment(body)
  const responseBody = new ResponseBody(200, 'OK', data)
  response.body = responseBody
  process.nextTick(next)
}

async function createAppointmentException(request, response, next) {
  const { body } = request
  const data = await AppointmentsModel.createAppointmentException(body)
  const responseBody = new ResponseBody(200, 'OK', data)
  response.body = responseBody
  process.nextTick(next)
}

async function getAllAppointments(request, response, next) {
  const { body } = request
  const data = await AppointmentsModel.getAllAppointments(body)
  const responseBody = new ResponseBody(200, 'OK', data)
  response.body = responseBody
  process.nextTick(next)
}

export default AppointmentsController
