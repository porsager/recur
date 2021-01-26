import t from './time.js'

const veventStringers = {
  dtstart: t.localToZoneless,
  dtend: t.localToZoneless,
  duration: x => t.toDuration(x),
  exdate: xs => xs.map(t.localToZoneless)
}

const rruleStringers = {
  until: t.localToZoneless
}

export default function stringify(v, r) {
  const vevent = []
      , rrule = []

  Object.entries(r).forEach(([k, v]) => {
    const value = String(k in rruleStringers ? rruleStringers[k](v) : v)
    value && rrule.push(k.toUpperCase() + '=' + value)
  })

  Object.entries(v).forEach(([k, v]) =>
    v != null && vevent.push(
      lines(
        k.toUpperCase().replace(/_/g, '-') +
        ':' +
        (k === 'rrule'
          ? rrule.join(';')
          : k in veventStringers ? veventStringers[k](v) : v
        )
      )
    )
  )

  return vevent.join('\n')
}

function lines(s) {
  if (s.length <= 72)
    return s

  let a = s.slice(0, 71)
  for (let i = 71; i < s.length; i += 70)
    a += '\n ' + s.slice(i, i + 70)

  return a
}
