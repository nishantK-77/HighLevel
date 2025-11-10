import { configureRouter } from '@am92/express-utils'

import AppointmentsController from './Appointments.Controller.mjs'

const { createAppointment, createAppointmentException, getAllAppointments } =
  AppointmentsController

const masterConfig = {
  routerName: 'Appointments',
  preMiddlewares: [],
  postMiddlewares: [],
  routesConfig: {
    createAppointment: {
      method: 'post',
      path: '/create',
      pipeline: [createAppointment]
    },
    getAllAppointments: {
      method: 'get',
      path: '/get-all-appointments',
      pipeline: [getAllAppointments]
    },
    createAppointmentException: {
      method: 'post',
      path: '/create-exception',
      pipeline: [createAppointmentException]
    }
  }
}

export default class AppointmentsRouter {
  constructor(Router, customConfig) {
    const resourceRouter = configureRouter(Router, masterConfig, customConfig)
    return resourceRouter
  }
}
