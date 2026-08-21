import t from './time.js'

const int = x => parseInt(x)
    , ints = x => x.split(',').map(int)

const veventParsers = {
  dtstart: x => t.zonelessToLocal(x),
  dtend: x => t.zonelessToLocal(x),
  exdate: x => x.split(',').map(x => t.zonelessToLocal(x)),
  duration: x => t.fromDuration(x),
  rrule: x => x
}

const rruleParsers = {
  freq: x => x,
  interval: int,
  count: int,
  until: x => t.zonelessToLocal(x),
  bysecond: ints,
  byminute: ints,
  byhour: ints,
  byday: x => x.split(','),
  bymonthday: ints,
  byyearday: ints,
  byweekno: ints,
  bymonth: ints,
  wkst: x => x,
  bysetpos: ints
}

function unfold(a) {
  return a.split(/\r?\n/).reduce((acc, x) => {
    if (!x)
      return acc

    x.charCodeAt(0) === 32 || x.charCodeAt(0) === 9
      ? acc[acc.length - 1] += x.slice(1)
      : acc.push(x)

    return acc
  }, [])
}

export default function parse(a) {
  const result = unfold(a).reduce((acc, x) => {
    const colon = x.indexOf(':')
    if (colon === -1)
      return acc

    const semi = x.indexOf(';')
        , idx = semi === -1 || colon < semi ? colon : semi
        , key = x.slice(0, idx).toLowerCase().replace(/-/g, '_')

    key in veventParsers && (
      acc[key] = veventParsers[key](x.slice(colon + 1))
    )

    return acc
  }, {})

  result.rrule && (
    result.rrule = result.rrule.split(';').reduce((acc, x) => {
      const key = x.slice(0, x.indexOf('=')).toLowerCase()
          , value = x.slice(x.indexOf('=') + 1)

      key in rruleParsers && (acc[key] = rruleParsers[key](value))

      return acc
    }, {})
  )

  return result
}