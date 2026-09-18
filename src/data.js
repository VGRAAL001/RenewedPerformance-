export const schedule = [
  { day: 'Monday', time: '06:10', className: 'Strength Training' }, { day: 'Monday', time: '06:50', className: 'Functional Fitness' }, { day: 'Monday', time: '16:30', className: 'Strength Training' }, { day: 'Monday', time: '17:30', className: 'Functional Fitness' },
  { day: 'Wednesday', time: '06:10', className: 'Run Fit' }, { day: 'Wednesday', time: '16:30', className: 'Functional Fitness' }, { day: 'Wednesday', time: '17:30', className: 'Strength Training' },
  { day: 'Thursday', time: '06:10', className: 'Functional Fitness' }, { day: 'Thursday', time: '06:50', className: 'Run Fit' }, { day: 'Thursday', time: '17:30', className: 'Functional Fitness' },
]

export const services = [
  { name: 'Strength and Conditioning', detail: 'Build useful strength, power, and confidence.' }, { name: 'Injury Rehabilitation', detail: 'Return to movement with a clear, measured plan.' }, { name: 'Sports Massage', detail: 'Focused recovery for hard-working bodies.' }, { name: 'Group Fitness', detail: 'Train together in an encouraging environment.' },
]

export const plans = [
  { name: '3x weekly', price: 'R650', detail: '3 classes per week', extra: 'Includes 1 free 30 min compression boots session per month', featured: true }, { name: '2x weekly', price: 'R500', detail: '2 classes per week', extra: '', featured: false }, { name: '1x weekly', price: 'R350', detail: '1 class per week', extra: '', featured: false },
]

export const oneOnOneServices = ['Biokinetics assessment', 'Injury rehabilitation session', 'Sports massage']

export const oneOnOneOptions = [
  { name: 'Biokinetics assessment', duration: 30, durationOptions: [30] },
  { name: 'Injury rehabilitation session', duration: 60, durationOptions: [30, 60, 90] },
  { name: 'Sports massage', duration: 30, durationOptions: [30, 45, 60] },
]