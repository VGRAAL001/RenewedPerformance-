export const schedule = [
  { day: 'Monday', time: '06:10', className: 'Strength Training' }, { day: 'Monday', time: '06:50', className: 'Functional Fitness' }, { day: 'Monday', time: '16:30', className: 'Strength Training' }, { day: 'Monday', time: '17:30', className: 'Functional Fitness' },
  { day: 'Wednesday', time: '06:10', className: 'Run Fit' }, { day: 'Wednesday', time: '16:30', className: 'Functional Fitness' }, { day: 'Wednesday', time: '17:30', className: 'Strength Training' },
  { day: 'Thursday', time: '06:10', className: 'Functional Fitness' }, { day: 'Thursday', time: '06:50', className: 'Run Fit' }, { day: 'Thursday', time: '17:30', className: 'Functional Fitness' },
]

export const services = [
  { name: 'Strength and Conditioning', detail: 'Build useful strength, power, and confidence.' }, { name: 'Injury Rehabilitation', detail: 'Return to movement with a clear, measured plan.' }, { name: 'Sports Massage', detail: 'Focused recovery for hard-working bodies.' }, { name: 'Group Fitness', detail: 'Train together in an encouraging environment.' },
]

export const specialDeals = [
  { label: 'New member offer', title: 'Start strong.', detail: 'Book your first assessment and get a clear plan for your next step.', oldPrice: 'R650', newPrice: 'R500', action: 'Book assessment', path: '/book-now' },
  { label: 'Member bonus', title: 'Train more. Recover better.', detail: 'Our 3x weekly membership includes one free compression boots session every month.', oldPrice: '', newPrice: '', action: 'View memberships', path: '/pricing' },
]

export const plans = [
  { name: '3x weekly', price: 'R650', detail: '3 classes per week', classSessions: 3, extra: 'Includes 1 free 30 min compression boots session per month', featured: true }, { name: '2x weekly', price: 'R500', detail: '2 classes per week', classSessions: 2, extra: '', featured: false }, { name: '1x weekly', price: 'R350', detail: '1 class per week', classSessions: 1, extra: '', featured: false }, { name: '6-week programme', price: 'R2000', detail: '2 one-on-one sessions per week · 6 weeks', classSessions: 0, oneOnOneSessions: 12, extra: '12 personalised sessions with an individual performance plan', purchaseType: 'program', featured: false },
]

export const oneOnOneServices = ['Biokinetics assessment', 'Injury rehabilitation session', 'Sports massage']

export const oneOnOneOptions = [
  { name: 'Biokinetics assessment', duration: 30, durationOptions: [30] },
  { name: 'Injury rehabilitation session', duration: 60, durationOptions: [30, 60, 90] },
  { name: 'Sports massage', duration: 30, durationOptions: [30, 45, 60] },
]