import { CustomError } from '@am92/express-utils'
import moment from 'moment'
import pkg from 'rrule'

import { db } from '../../helpers/dbConnection.mjs'
import AppointmentsHelper from './Appointments.Helpers.mjs'

const { _checkAvailability, _suggestNextAvailable } = AppointmentsHelper

const { RRule } = pkg

const AppointmentsModel = {
  createAppointment,
  createAppointmentException,
  getAllAppointments
}

async function createAppointment(attrs = {}) {
  console.log('here', attrs)
  const { resource_id, title, start_time, end_time, recurrence } = attrs
  // const formattedStartTime = moment(start_time, 'DD-MM-YYYY HH:mm:ss')
  const formattedStartTime = new Date(start_time)
  const formattedEndTime = new Date(end_time)
  // const formattedEndTime = moment(end_time).format('DD-MM-YYYY HH:mm:ss')

  let recurrence_rule = null
  if (recurrence) {
    const rule = new RRule({
      freq: RRule[recurrence.freq],
      interval: recurrence.interval || 1,
      dtstart: new Date(formattedStartTime),
      until: recurrence.until ? moment(recurrence.until) : null
    })
    recurrence_rule = rule.toString()
  }
  const available = await _checkAvailability(
    resource_id,
    formattedStartTime,
    formattedEndTime,
    recurrence_rule
  )
  console.log(formattedStartTime, formattedEndTime, available)
  if (!available) {
    const suggestions = await _suggestNextAvailable(
      resource_id,
      formattedStartTime,
      formattedEndTime
    )

    throw new CustomError(
      {},
      {
        statusCode: 409,
        message: 'Time slot unavailable',
        data: { suggestions }
      }
    )
  }

  console.log(
    resource_id,
    title,
    formattedStartTime,
    formattedEndTime,
    recurrence_rule
  )

  await db.query(
    `INSERT INTO appointments (resource_id, title, start_time, end_time, recurrence_rule)
         VALUES (?, ?, ?, ?, ?)`,
    [resource_id, title, formattedStartTime, formattedEndTime, recurrence_rule]
  )

  return { message: 'Appointment booked successfully' }
}

async function createAppointmentException(attrs = {}) {
  console.log('here', attrs)
  const { exception_date, reason, id: appointment_id } = attrs

  await db.query(
    `INSERT INTO appointment_exceptions (appointment_id, exception_date, reason)
       VALUES (?, ?, ?)`,
    [appointment_id, new Date(exception_date), reason || null]
  )
  return { message: 'Exception added successfully ' }
}

async function getAllAppointments(attrs = {}) {
  console.log('here', attrs)
  const { resource_id } = attrs
  const [rows] = await db.query(
    `SELECT * FROM appointments WHERE resource_id = ?`,
    [resource_id]
  )
  return { data: rows }
}

export default AppointmentsModel
