import parse from './parse.js'
import stringify from './stringify.js'
import t from './time.js'

export { t }

const freqs = {
  SECONDLY: x => x.byweekno = undefined,
  MINUTELY: x => x.byweekno = undefined,
  HOURLY  : x => x.byweekno = undefined,
  DAILY   : x => (x => x.byweekno = undefined, x.byyearday = undefined),
  WEEKLY  : x => (x => x.byweekno = undefined, x.byyearday = undefined, x.bymonthday = undefined),
  MONTHLY : x => (x => x.byweekno = undefined, x.byyearday = undefined),
  YEARLY  : x => { /* noop */ }
}

function isBetween(key, value, ...ranges) {
  if (value != null && (value % 1 !== 0 || !ranges.some(x => value >= x[0] && value <= x[1])))
    throw new Error(key + ': ' + value + ' is invalid - must be an int between ' + ranges.map(x => x[0] + ' and ' + x[1]).join(' or '))

  return value
}

function isIn(xs, key, value) {
  if (value != null && value in xs === false)
    throw new Error(key + ': ' + value + ' is invalid - must be one of ' + Object.keys(xs).join(' | '))

  return value
}

function isDate(key, value) {
  if (value != null && (value instanceof Date === false || isNaN(value.getTime())))
    throw new Error(key + ': ' + value + ' is invalid - must be an instance of Date')

  return value
}

export default function Recur(input) {
  const x = typeof input === 'string'
    ? parse(input)
    : { ...input }

  const r = Object.assign({}, x.rrule || {})

  const recur = {
    get dtstart() { return x.dtstart },
    set dtstart(v) {
      isDate('DTSTART', v)
      const d = x.dtend && duration()
      x.dtstart = v
      if (d && x.dtstart.getTime() > x.dtend.getTime())
        x.dtend = new Date(x.dtend.getTime() + d)
    },

    get dtend() { return x.dtend },
    set dtend(v) {
      isDate('DTEND', v)
      if (v.getTime() < x.dtstart.getTime())
        throw new Error('DTEND = ' + v + ' can not be lower than DTSTART = ' + x.dtstart)

      x.dtend = v
      x.duration = undefined
    },

    get duration() { return x.duration },
    set duration(v) { (x.dtend = undefined, x.duration = v) },

    get exdate() { return x.exdate || (x.exdate = []) },
    set exdate(v) { x.exdate = v.length ? v.map(x => isDate('EXDATE', x)) : undefined },

    rrule: {
      get freq() { return r.freq },
      set freq(v) {
        r.freq = isIn(freqs, 'FREQ', v)
      },

      get interval() { return r.interval },
      set interval(v) { r.interval = isBetween('INTERVAL', v, [1, 2147483647]) },

      get count() { return r.count },
      set count(v) { r.count = isBetween('INTERVAL', v, [1, 2147483647]) },

      get until() { return r.until },
      set until(v) { r.until = isDate('UNTIL', v) },

      get bysecond() { return r.bysecond },
      set bysecond(v) { r.bysecond = v.map(x => isBetween('BYSECOND', x, [0, 60])) },

      get byminute() { return r.byminute },
      set byminute(v) { r.byminute = v.map(x => isBetween('BYMINUTE', x, [0, 59])) },

      get byhour() { return r.byhour },
      set byhour(v) { r.byhour = v.map(x => isBetween('BYHOUR', x, [0, 23])) },

      get byday() { return r.byday },
      set byday(v) { r.byday = v.map(x => isIn(t.daysMap, 'BYDAY', ('' + x).slice(-2)), x) },

      get bymonthday() { return r.bymonthday },
      set bymonthday(v) { r.bymonthday = v.map(x => isBetween('BYHOUR', x, [-31, -1], [1, 31])) },

      get byyearday() { return r.byyearday },
      set byyearday(v) { r.byyearday = v.map(x => isBetween('BYHOUR', x, [-366, -1], [1, 366])) },

      get byweekno() { return r.byweekno },
      set byweekno(v) { r.byweekno = v.map(x => isBetween('BYWEEKNO', x, [-53, -1], [1, 53])) },

      get bymonth() { return r.bymonth },
      set bymonth(v) { r.bymonth = v.map(x => isBetween('BYMONTH', x, [1, 12])) },

      get wkst() { return r.wkst },
      set wkst(v) { r.wkst = isIn(t.daysMap, 'BYSETPOS', v) },

      get bysetpos() { return r.bysetpos },
      set bysetpos(v) { r.bysetpos = v.map(x => isBetween('BYSETPOS', x, [-366, -1], [1, 366])) }
    }
  }

  Object.entries(x).forEach(([k, v]) =>
    k !== 'rrule' && (recur[k] = v)
  )

  Object.entries(r).forEach(([k, v]) =>
    recur.rrule[k] = v
  )

  Object.defineProperties(recur, {
    toString: {
      enumerate: false,
      value: () => stringify(x, r)
    },
    iterator: {
      enumerate: false,
      value: iterator
    },
    between: {
      enumerate: false,
      value: between
    },
    contains: {
      enumerate: false,
      value: contains
    },
    first: {
      enumerate: false,
      value: first
    },
    utcDuration: {
      enumerate: false,
      value: duration
    }
  })

  return recur

  function duration() {
    return recur.duration
      ? recur.duration * 1000
      : (recur.dtend
        ? (t.localToUTC(isDate('DTEND', recur.dtend)).getTime() - t.localToUTC(recur.dtstart).getTime())
        : 0
      )
  }

  function contains(date) {
    const d = duration()

    return between(
      new Date(date.getTime() - d),
      date
    ).some(x =>
      date.getTime() >= x.getTime() && (!d || date.getTime() < x.getTime() + d)
    )
  }

  function between(start, end) {
    const i = iterator(start)
        , xs = []

    let last = i.next().value

    while (last && last.getTime() <= end.getTime()) {
      xs.push(last)
      last = i.next().value
    }

    return xs
  }

  function first() {
    const i = iterator()
        , date = i.next().value

    return valid(date)
      ? date
      : i.next().value
  }

  function valid(date) {
    return r.byday.includes(t.days[date.getDay()])
  }

  function iterator(start) {
    const freqs = {
      SECONDLY  : secondly(t.s),
      MINUTELY  : secondly(t.m),
      HOURLY    : secondly(t.h),
      DAILY     : secondly(t.d),
      WEEKLY
    }

    const wkst = r.wkst || 'MO'
        , dayMap    = t.daysMap[wkst]

    const dtstart = t.localToUTC(x.dtstart)
        , dtend = x.dtend && t.localToUTC(x.dtstart)
        , exdate = x.exdate && x.exdate.map(x => t.localToUTC(x).getTime())
        , duration = x.duration && Object.assign({}, x.duration)
        , freq = freqs[r.freq]
        , interval = r.interval || 1
        , until = r.until && t.localToUTC(r.until).getTime()
        , bysecond = r.bysecond ? r.bysecond.slice() : [dtstart.getSeconds()]
        , byminute = r.byminute ? r.byminute.slice() : [dtstart.getMinutes()]
        , byhour = r.byhour ? r.byhour.slice() : [dtstart.getHours()]
        , byday = r.byday ? r.byday.slice() : [dayMap[dtstart.getDay()]]
        , bymonthday = r.bymonthday ? r.bymonthday.slice() : [dtstart.getDate()]
        , byyearday = r.byyearday ? r.byyearday.slice() : [t.yearDay(dtstart)]
        , byweekno = r.byweekno ? r.byweekno.slice() : [t.weekNumber(dtstart)]
        , bymonth = r.bymonth ? r.bymonth.slice() : []
        , bysetpos = r.bysetpos ? r.bysetpos.slice() : []
        , count = r.count

    let rest = count

    const days      = byday.map(x => dayMap[x]).sort()
        , firstDay  = days[0] * t.d

    const nextDay   = [...Array(days[days.length - 1])].reduce((acc, x, i) => {
      acc[i] = (days.find(x => x > i) - i) * t.d
      return acc
    }, {})

    let value
      , done

    global.i = 0

    return {
      next: () => done || next()
    }

    function next() {
      if (count && rest-- === 0)
        return (done = { done: true })

      let x = get()

      if (start) {
        while (x.value && x.value.getTime() < start.getTime()) {
          x = done || (
            count && rest-- === 0
            ? (done = { done: true })
            : get()
          )
        }
      }

      return x
    }

    function get() {
      value = value ? freq(value) : dtstart
      if (until && value.getTime() >= until)
        return (done = { done: true })

      return exdate && exdate.indexOf(value.getTime()) !== -1
        ? get()
        : { done: false, value: t.UTCToLocal(value) }
    }

    function secondly(ms) {
      return function(date) {
        return new Date(date.getTime() + ms * interval)
      }
    }

    function WEEKLY(date) {
      const day = dayMap[date.getUTCDay()]

      date = new Date(date.getTime() + (
        nextDay[day] ||
        -day * t.d + t.w * interval + firstDay
      ))

      return date
    }
  }
}
