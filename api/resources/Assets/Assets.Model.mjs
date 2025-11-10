import { CustomError } from '@am92/express-utils'
import moment from 'moment'
import pkg from 'rrule'

import { db } from '../../helpers/dbConnection.mjs'

import ASSETS_CONFIG from './Assets.Config.mjs'

const {
  WORKING_HOURS_START,
  WORKING_HOURS_END,
  WORKING_WEEK_START,
  WORKING_WEEK_END
} = ASSETS_CONFIG

const { rrulestr } = pkg

const AssetsModel = {
  createAsset,
  getAllAssets,
  getAvailability
}

export default AssetsModel

async function createAsset(attrs = {}) {
  console.log('here', attrs)

  const { name } = attrs
  const response = await db.execute(`INSERT INTO resources (name) VALUES (?)`, [
    name
  ])
  return response
}

async function getAllAssets(attrs = {}) {
  console.log('here', attrs)
  const [rows] = await db.execute(`SELECT * FROM resources ORDER BY name ASC`)
  return rows
}

async function getAvailability(attrs = {}) {
  const { resource_id, start, end } = attrs
  console.log(new Date(), new Date(start), moment(start), '>>>>')
  if (!start || !end)
    throw new CustomError(
      {},
      { statusCode: 400, message: 'start and end params required' }
    )
  const rangeStart = moment(start)
  const rangeEnd = moment(end)

  const bookedSlots = await getBookedSlots(resource_id, rangeStart, rangeEnd)
  const workingHours = { start: WORKING_HOURS_START, end: WORKING_HOURS_END } // 09:00–17:00
  const workingDays = { start: WORKING_WEEK_START, end: WORKING_WEEK_END } // Mon–Fri
  const availableSlots = getAvailableSlots(
    bookedSlots,
    rangeStart,
    rangeEnd,
    workingHours,
    workingDays
  )

  return {
    resourceId: resource_id,
    range: { start, end },
    bookedSlots,
    availableSlots,
    workingHours,
    workingDays
  }
}

async function getExceptions(appointmentId) {
  const [rows] = await db.query(
    `SELECT exception_date FROM appointment_exceptions WHERE appointment_id = ?`,
    [appointmentId]
  )
  return rows.map(r => moment(r.exception_date))
}

async function getBookedSlots(resource_id, rangeStart, rangeEnd) {
  console.log(resource_id, rangeStart, rangeEnd)
  const [appointments] = await db.query(
    `SELECT * FROM appointments WHERE resource_id = ?`,
    [resource_id]
  )

  console.log(appointments, 'appointments')

  const bookedSlots = []

  for (const appt of appointments) {
    const start = moment(appt.start_time)
    const end = moment(appt.end_time)
    const duration = moment.duration(end.diff(start))

    if (!appt.recurrence_rule) {
      if (start.isBefore(rangeEnd) && end.isAfter(rangeStart)) {
        bookedSlots.push({
          start: start.toISOString(),
          end: end.toISOString(),
          title: appt.title
        })
      }
    } else {
      const rule = rrulestr(appt.recurrence_rule, { dtstart: start.toDate() })
      const exceptions = await getExceptions(appt.id)
      const occurrences = rule.between(
        rangeStart.toDate(),
        rangeEnd.toDate(),
        true
      )

      for (const occ of occurrences) {
        const occStart = moment(occ)
        if (exceptions.some(ex => ex.isSame(occStart, 'minute'))) continue
        const occEnd = occStart.clone().add(duration)

        bookedSlots.push({
          start: occStart.toISOString(),
          end: occEnd.toISOString(),
          title: appt.title
        })
      }
    }
  }

  return bookedSlots.sort((a, b) => moment(a.start).diff(moment(b.start)))
}

function getAvailableSlots(
  bookedSlots,
  rangeStart,
  rangeEnd,
  workingHours,
  workingDays
) {
  const availableSlots = []
  const current = moment(rangeStart)

  while (current.isBefore(rangeEnd, 'day')) {
    const dayStart = moment(current).hour(workingHours.start).minute(0)
    const dayEnd = moment(current).hour(workingHours.end).minute(0)

    if (
      current.isoWeekday() >= workingDays.start &&
      current.isoWeekday() <= workingDays.end
    ) {
      let cursor = dayStart.clone()

      const dayBookings = bookedSlots.filter(slot =>
        moment(slot.start).isBetween(dayStart, dayEnd, null, '[)')
      )

      for (const slot of dayBookings) {
        const slotStart = moment(slot.start)
        if (cursor.isBefore(slotStart)) {
          availableSlots.push({
            start: cursor.toISOString(),
            end: slotStart.toISOString()
          })
        }
        cursor = moment.max(cursor, moment(slot.end))
      }

      if (cursor.isBefore(dayEnd)) {
        availableSlots.push({
          start: cursor.toISOString(),
          end: dayEnd.toISOString()
        })
      }
    }
    current.add(1, 'day')
  }

  return availableSlots
}

// Allow exceptions (skip/cancel specific instances).
// If a conflict is detected: Return a structured response with conflicting meetings
// and next available suggestions
