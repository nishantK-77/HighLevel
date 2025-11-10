import Express from 'express'

import { AppointmentsRouter } from '../resources/Appointments/index.mjs'

const config = {
  routesConfig: {
    createAppointment: { enabled: true },
    createAppointmentException: { enabled: true },
    getAllAppointments: { enabled: true }
  }
}

const Router = new Express.Router()
const appointmentsRouter = new AppointmentsRouter(Router, config)

export default appointmentsRouter
