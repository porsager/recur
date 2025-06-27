const t = { s: 1000 }

export default t

t.dayOfYear = d => Math.floor(
  (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000
)

t.days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
t.daysMap = t.days.reduce((acc, day, dayInt) => {
  acc[day] = t.days.reduce((acc, x, i) => {
    acc[x] = (i + (7 - dayInt)) % 7
    acc[i] = (i + (7 - dayInt)) % 7
    return acc
  }, {})
  return acc
}, {})

t.m = t.s * 60
t.h = t.m * 60
t.d = t.h * 24
t.w = t.d * 7

t.fromDuration = x => {
  const xs = {
    sign: x[0] === '-' ? '-' : '+',
    years: 0, months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0
  }

  let time = false
    , n = ''
    , char = ''

  for (let i = 0; i < x.length; i++) {
    char = x[i]
    if (char === 'P') n = ''
    else if (char === 'Y') (xs.years = parseFloat(n), n = '')
    else if (char === 'M') (xs[time ? 'minutes' : 'months'] = parseFloat(n), n = '')
    else if (char === 'W') (xs.weeks = parseFloat(n), n = '')
    else if (char === 'D') (xs.days = parseFloat(n), n = '')
    else if (char === 'T') (time = true, n = '')
    else if (char === 'H') (xs.hours = parseFloat(n), n = '')
    else if (char === 'S') (xs.seconds = parseFloat(n), n = '')
    else if (char === ',') (n += '.')
    else n += char
  }

  return xs
}

t.toDuration = x => {
  return (x.sign === '-' ? '-' : '') + 'P' +
    (x.years ? x.years + 'Y' : '') +
    (x.months ? x.months + 'M' : '') +
    (x.weeks ? x.weeks + 'W' : '') +
    (x.days ? x.days + 'D' : '') +
    (x.hours || x.minutes || x.seconds ? 'T' : '') +
    (x.hours ? x.hours + 'H' : '') +
    (x.minutes ? x.minutes + 'M' : '') +
    (x.seconds ? x.seconds + 'S' : '')
}

t.parse = x => x.split(/[Z+]/)[0]
  .match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/)
  .slice(1)
  .map((x, i) =>
    1 * (
      i === 1 // Months are 0 indexed
        ? x - 1
        : i === 5 && x === '60' // Leap seconds
          ? 59
          : x
    )
  )

t.UTCToLocal = x => new Date(x.getTime() + (x.getTimezoneOffset() * 60000))

t.localToUTC = x => new Date(x.getTime() - (x.getTimezoneOffset() * 60000))

t.zonelessToUTC = x => new Date(Date.UTC(...t.parse(x)))
t.zonelessToLocal = x => new Date(...t.parse(x))
t.UTCToZoneless = (x = new Date()) => x.toISOString().slice(0, 19).replace(/[^\dT]/g, '')
t.localToZoneless = (x = new Date()) => new Date(
  x - x.getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace(/[^\dT.]/g, ''
)

t.weekNumber = (date) => {
  date = new Date(date)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + 3)

  const firstThursday = date.getTime()

  date.setMonth(0, 1)
  if (date.getDay() !== 4)
    date.setMonth(0, 1 + ((4 - date.getDay()) + 7) % 7)

  return 1 + Math.ceil((firstThursday - date) / t.w)
}

t.yearDay = date => Math.floor((date.getTime() - Date.UTC(date.getFullYear, 0, 0)) / 24 * 60 * 60 * 1000)
