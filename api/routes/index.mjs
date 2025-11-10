import AppointmentsRouter from './Appointments.mjs'
import AssetsRouter from './Assets.mjs'

const Routes = [
  { path: '/appointments', router: AppointmentsRouter },
  { path: '/assets', router: AssetsRouter }
]

export default Routes
