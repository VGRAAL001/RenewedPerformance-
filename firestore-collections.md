# Firestore Collections

## `classes`

Create one document per scheduled class. The booking page reads documents whose `date` falls within the next seven days.

Required fields:

```text
className: "Strength Training"
date: "2026-09-21"
time: "06:10"
capacity: 10
booked: 3
recurrence: "weekly"
recurrenceEnd: "2026-12-31"
```

The available number shown to members is `capacity - booked`.

Recurring classes are stored as separate dated documents so each occurrence can have its own capacity and bookings.

## `users`

Created automatically after signup or login:

```text
name: "Aaliyah Van Graan"
email: "member@example.com"
phone: "+27821234567"
cellPhone: "+27821234567"
dateOfBirth: "1995-04-12"
age: 31
gender: "prefer-not-to-say"
sessionsAvailable: 0
oneOnOneSessions: 0
groupSessionsAvailable: 0
createdAt: timestamp
updatedAt: timestamp
```

Recurring memberships are stored on the user's document after checkout:

```text
subscription: {
	status: "active",
	billingInterval: "monthly",
	price: "R650",
	nextBillingDate: "2026-10-26"
}
```

The current checkout records the member's recurring choice. Connect the payment form to a payment provider or server-side billing function before using it to charge cards automatically.

## `bookings`

Created automatically after a member confirms a booking. It stores the selected class or one-on-one session, contact details, user ID, status, and creation timestamp.

## `oneOnOneSlots`

Reserved 30-minute time blocks for one-on-one sessions. These documents contain no customer details and are safe for the public booking page to read:

```text
dateKey: "2026-09-21"
time: "09:30"
status: "reserved"
```

Longer services reserve multiple consecutive documents. For example, a 60-minute session reserves both `09:30` and `10:00`.

## Email and Google Calendar delivery

The `processBookingConfirmation` Firebase Function runs when a confirmed booking is created. It creates an event in the admin Google Calendar and writes a document to `mail` with an `.ics` attachment. Install Firebase's **Trigger Email** extension and configure it to watch the `mail` collection.

Configure these Firebase Functions environment variables before deployment:

```text
GOOGLE_CALENDAR_ID=the admin calendar ID
GOOGLE_SERVICE_ACCOUNT_JSON=the Google service account JSON document
ADMIN_EMAIL=arendsberucia@gmail.com
```

Share the admin's Google Calendar with the service account email and grant **Make changes to events**. Enable the Google Calendar API in the Google Cloud project. Deploy with `firebase deploy --only functions,firestore:rules` after authenticating with `firebase login`.