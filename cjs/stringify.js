const t = require('./time.js')

const veventStringers = {
  dtstart: t.localToZoneless,
  dtend: t.localToZoneless,
  duration: x => t.toDuration(x),
  exdate: xs => xs.map(t.localToZoneless)
}

const rruleStringers = {
  until: t.localToZoneless
}

module.exports = stringify;function stringify(v, r) {
  const vevent = []
      , rrule = []

  Object.entries(r).forEach(([k, x]) => {
    if (x == null)
      return
    const value = String(k in rruleStringers ? rruleStringers[k](x) : x)
    value && rrule.push(k.toUpperCase() + '=' + value)
  })

  Object.entries(v).forEach(([k, x]) =>
    k !== 'rrule' && x != null && vevent.push(
      lines(
        k.toUpperCase().replace(/_/g, '-') +
        ':' +
        (k in veventStringers ? veventStringers[k](x) : x)
      )
    )
  )

  rrule.length && vevent.push(lines('RRULE:' + rrule.join(';')))
  return vevent.join('\r\n')
}

function lines(s) {
  if (s.length <= 75)
    return s

  let a = s.slice(0, 75)
  for (let i = 75; i < s.length; i += 74)
    a += '\r\n ' + s.slice(i, i + 74)

  return a
}
