const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { logger } = require('firebase-functions')
const admin = require('firebase-admin')
const { google } = require('googleapis')

admin.initializeApp()

function getCalendarClient() {
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
  return google.calendar({ version: 'v3', auth })
}

function escapeIcs(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

function toIcsTimestamp(date, time) {
  return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`
}

function buildInvite({ bookingId, booking, startTime, endTime }) {
  const start = toIcsTimestamp(booking.dateKey || booking.date, startTime)
  const end = toIcsTimestamp(booking.dateKey || booking.date, endTime)
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Renewed Performance//Bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${bookingId}@renewedperformance`,
    `DTSTAMP:${now}Z`,
    `DTSTART;TZID=Africa/Johannesburg:${start}`,
    `DTEND;TZID=Africa/Johannesburg:${end}`,
    `SUMMARY:${escapeIcs(booking.name)}`,
    `DESCRIPTION:${escapeIcs(booking.injury || booking.comments || 'Renewed Performance appointment')}`,
    'LOCATION:94 Strand St, Cape Town City Centre',
    `ORGANIZER;CN=Renewed Performance:mailto:${process.env.ADMIN_EMAIL || 'arendsberucia@gmail.com'}`,
    `ATTENDEE;CN=${escapeIcs(booking.customerName)};RSVP=TRUE:mailto:${booking.customerEmail}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

exports.processBookingConfirmation = onDocumentCreated('bookings/{bookingId}', async event => {
  const snapshot = event.data
  if (!snapshot) return
  const booking = snapshot.data()
  if (booking.status !== 'confirmed' || !booking.customerEmail) return

  const bookingId = event.params.bookingId
  const duration = Number(booking.duration || (booking.type === 'class' ? 60 : 30))
  const startMinutes = Number(String(booking.time || '09:00').slice(0, 2)) * 60 + Number(String(booking.time || '09:00').slice(3))
  const endMinutes = startMinutes + duration
  const startTime = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
  const date = booking.dateKey || booking.date
  const summary = `${booking.name} · ${booking.date || date} at ${startTime}`
  const description = booking.injury || booking.comments || 'Renewed Performance appointment'

  try {
    const calendar = getCalendarClient()
    const calendarEvent = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      sendUpdates: 'all',
      requestBody: {
        id: `renewedperformance${bookingId}`,
        summary: booking.name,
        description,
        location: '94 Strand St, Cape Town City Centre',
        start: { dateTime: `${date}T${startTime}:00+02:00`, timeZone: 'Africa/Johannesburg' },
        end: { dateTime: `${date}T${endTime}:00+02:00`, timeZone: 'Africa/Johannesburg' },
        attendees: [{ email: booking.customerEmail, displayName: booking.customerName }],
      },
    })

    const ics = buildInvite({ bookingId, booking, startTime, endTime })
    await admin.firestore().collection('mail').add({
      to: [booking.customerEmail],
      message: {
        subject: `Booking confirmed: ${summary}`,
        text: `Your Renewed Performance booking is confirmed for ${summary}.\n\n${description}`,
        html: `<p>Your Renewed Performance booking is confirmed.</p><p><strong>${summary}</strong></p><p>${description}</p>`,
        attachments: [{ filename: 'renewed-performance-booking.ics', content: Buffer.from(ics).toString('base64'), encoding: 'base64', contentType: 'text/calendar; method=REQUEST' }],
      },
    })
    await snapshot.ref.update({ calendarEventId: calendarEvent.data.id, confirmationEmailQueuedAt: admin.firestore.FieldValue.serverTimestamp() })
  } catch (error) {
    logger.error('Could not create booking calendar event or email', { bookingId, error: error.message })
    await snapshot.ref.update({ confirmationError: error.message })
  }
})
