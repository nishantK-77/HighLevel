import moment from 'moment'
import pkg from 'rrule'

import { db } from '../../helpers/dbConnection.mjs'

import APPOINTMENTS_CONFIG from './Appointments.Config.mjs'

const { MAX_SUGGESTIONS_COUNT } = APPOINTMENTS_CONFIG

const { rrulestr } = pkg

const AppointmentsHelper = {
  _checkAvailability,
  _generateNewOccurrences,
  _suggestNextAvailable
  // _checkConflictWithExisting,
  // _checkConflictsWithNonRecurring,
  // _checkConflictsWithRecurring,
  // _overlaps,
  // _getExceptions
}

export default AppointmentsHelper

async function _checkAvailability(
  resource_id,
  newStart,
  newEnd,
  recurrence_rule = null
) {
  const [existingAppointments] = await db.query(
    `SELECT * FROM appointments WHERE resource_id = ?`,
    [resource_id]
  )

  const newOccurrences = _generateNewOccurrences(
    newStart,
    newEnd,
    recurrence_rule
  )

  for (const appt of existingAppointments) {
    const hasConflict = await _checkConflictWithExisting(appt, newOccurrences)
    if (hasConflict) return false
  }

  return true
}

/**
 * Generate occurrences for a new appointment (handles recurring and non-recurring)
 */
function _generateNewOccurrences(newStart, newEnd, recurrence_rule) {
  const newStartMoment = moment(newStart)
  const newEndMoment = moment(newEnd)
  const newDuration = moment.duration(newEndMoment.diff(newStartMoment))

  if (!recurrence_rule) {
    return [{ start: newStartMoment, end: newEndMoment }]
  }

  const rule = rrulestr(recurrence_rule, {
    dtstart: newStartMoment.toDate()
  })

  const occurrences = rule.between(
    moment().subtract(6, 'months').toDate(),
    moment().add(6, 'months').toDate(),
    true
  )

  return occurrences.map(occ => ({
    start: moment(occ),
    end: moment(occ).add(newDuration)
  }))
}

/**
 * Check if any of the new occurrences overlap with an existing appointment.
 */
async function _checkConflictWithExisting(existingAppt, newOccurrences) {
  const apptStart = moment(existingAppt.start_time)
  const apptEnd = moment(existingAppt.end_time)
  const apptDuration = moment.duration(apptEnd.diff(apptStart))

  // Non-recurring appointment
  if (!existingAppt.recurrence_rule) {
    return _checkConflictsWithNonRecurring(apptStart, apptEnd, newOccurrences)
  }

  // Recurring appointment
  return await _checkConflictsWithRecurring(
    existingAppt,
    apptStart,
    apptDuration,
    newOccurrences
  )
}

function _checkConflictsWithNonRecurring(apptStart, apptEnd, newOccurrences) {
  for (const element of newOccurrences) {
    if (_overlaps(element.start, element.end, apptStart, apptEnd)) {
      return true
    }
  }
  return false
}

async function _checkConflictsWithRecurring(
  appt,
  apptStart,
  apptDuration,
  newOccurrences
) {
  const rule = rrulestr(appt.recurrence_rule, {
    dtstart: apptStart.toDate()
  })
  const exceptions = await _getExceptions(appt.id)

  const occurrences = rule.between(
    moment().subtract(6, 'months').toDate(),
    moment().add(6, 'months').toDate(),
    true
  )

  for (const element of occurrences) {
    const occStart = moment(element)
    if (exceptions.some(ex => ex.isSame(occStart, 'minute'))) continue

    const occEnd = occStart.clone().add(apptDuration)

    for (const newOcc of newOccurrences) {
      if (_overlaps(newOcc.start, newOcc.end, occStart, occEnd)) {
        return true
      }
    }
  }

  return false
}

async function _suggestNextAvailable(resource_id, start, end) {
  let newStart = moment(start).add(30, 'minutes'),
    newEnd = moment(end).add(30, 'minutes'),
    suggestions = [],
    count = MAX_SUGGESTIONS_COUNT

  while (count) {
    const status = await _checkAvailability(resource_id, newStart, newEnd, null)
    console.log('here', status)
    if (status) {
      suggestions.push({ start: newStart.format(), end: newEnd.format() })
      count--
    }
    newStart.add(30, 'minutes')
    newEnd.add(30, 'minutes')
  }

  // while (!(await _checkAvailability(resource_id, newStart, newEnd, null))) {
  //   newStart.add(30, 'minutes')
  //   newEnd.add(30, 'minutes')
  // }
  return suggestions
  // return { start: newStart.format(), end: newEnd.format() }
}

function _overlaps(start1, end1, start2, end2) {
  return start1.isBefore(end2) && end1.isAfter(start2)
}

async function _getExceptions(appointmentId) {
  const [rows] = await db.query(
    `SELECT exception_date FROM appointment_exceptions WHERE appointment_id = ?`,
    [appointmentId]
  )
  return rows.map(r => moment(r.exception_date))
}
