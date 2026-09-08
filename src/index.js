import parse from './parse.js'
import stringify from './stringify.js'
import t from './time.js'

export { t }

const freqs = {
  SECONDLY: x => x.byweekno = undefined,
  MINUTELY: x => x.byweekno = undefined,
  HOURLY  : x => x.byweekno = undefined,
  DAILY   : x => (x.byweekno = undefined, x.byyearday = undefined),
  WEEKLY  : x => (x.byweekno = undefined, x.byyearday = undefined, x.bymonthday = undefined),
  MONTHLY : x => (x.byweekno = undefined, x.byyearday = undefined),
  YEARLY  : x => { /* noop */ }
}

const unimplemented = ['bysecond', 'byminute', 'byhour', 'bymonthday', 'byyearday', 'byweekno', 'bymonth', 'bysetpos']
const monthTable = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

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

function toDate(key, value) {
  return isDate(key, typeof value === 'number' ? new Date(value) : value)
}

function ms(x) {
  return x instanceof Date ? x.getTime() : x
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

  let iter
    , dur

  const invalidate = () => iter = dur = undefined

  const recur = {
    get dtstart() { return x.dtstart },
    set dtstart(v) {
      v = toDate('DTSTART', v)
      const d = x.dtend && duration()
      x.dtstart = v
      if (d && x.dtstart.getTime() > x.dtend.getTime())
        x.dtend = new Date(v.getTime() + d)
      invalidate()
    },

    get dtend() { return x.dtend },
    set dtend(v) {
      v = toDate('DTEND', v)
      if (v.getTime() < x.dtstart.getTime())
        throw new Error('DTEND = ' + v + ' can not be lower than DTSTART = ' + x.dtstart)

      x.dtend = v
      x.duration = undefined
      invalidate()
    },

    get duration() { return x.duration },
    set duration(v) { (x.dtend = undefined, x.duration = v, invalidate()) },

    get exdate() { return x.exdate || (x.exdate = []) },
    set exdate(v) { (x.exdate = v.length ? v.map(x => toDate('EXDATE', x)) : undefined, invalidate()) },

    rrule: {
      get freq() { return r.freq },
      set freq(v) { (r.freq = isIn(freqs, 'FREQ', v), invalidate()) },

      get interval() { return r.interval },
      set interval(v) { (r.interval = isBetween('INTERVAL', v, [1, 2147483647]), invalidate()) },

      get count() { return r.count },
      set count(v) { (r.count = isBetween('COUNT', v, [1, 2147483647]), invalidate()) },

      get until() { return r.until },
      set until(v) { (r.until = toDate('UNTIL', v), invalidate()) },

      get bysecond() { return r.bysecond },
      set bysecond(v) { (r.bysecond = v.map(x => isBetween('BYSECOND', x, [0, 60])), invalidate()) },

      get byminute() { return r.byminute },
      set byminute(v) { (r.byminute = v.map(x => isBetween('BYMINUTE', x, [0, 59])), invalidate()) },

      get byhour() { return r.byhour },
      set byhour(v) { (r.byhour = v.map(x => isBetween('BYHOUR', x, [0, 23])), invalidate()) },

      get byday() { return r.byday },
      set byday(v) { (r.byday = v.map(x => (isIn(t.daysMap, 'BYDAY', ('' + x).slice(-2)), x)), invalidate()) },

      get bymonthday() { return r.bymonthday },
      set bymonthday(v) { (r.bymonthday = v.map(x => isBetween('BYMONTHDAY', x, [-31, -1], [1, 31])), invalidate()) },

      get byyearday() { return r.byyearday },
      set byyearday(v) { (r.byyearday = v.map(x => isBetween('BYYEARDAY', x, [-366, -1], [1, 366])), invalidate()) },

      get byweekno() { return r.byweekno },
      set byweekno(v) { (r.byweekno = v.map(x => isBetween('BYWEEKNO', x, [-53, -1], [1, 53])), invalidate()) },

      get bymonth() { return r.bymonth },
      set bymonth(v) { (r.bymonth = v.map(x => isBetween('BYMONTH', x, [1, 12])), invalidate()) },

      get wkst() { return r.wkst },
      set wkst(v) { (r.wkst = isIn(t.daysMap, 'WKST', v), invalidate()) },

      get bysetpos() { return r.bysetpos },
      set bysetpos(v) { (r.bysetpos = v.map(x => isBetween('BYSETPOS', x, [-366, -1], [1, 366])), invalidate()) }
    }
  }

  Object.entries(x).forEach(([k, v]) =>
    k !== 'rrule' && (recur[k] = v)
  )

  Object.entries(r).forEach(([k, v]) =>
    v == null || (recur.rrule[k] = v)
  )

  Object.defineProperties(recur, {
    toString: {
      enumerable: false,
      value: () => stringify(x, r)
    },
    iterator: {
      enumerable: false,
      value: iterator
    },
    between: {
      enumerable: false,
      value: between
    },
    contains: {
      enumerable: false,
      value: contains
    },
    first: {
      enumerable: false,
      value: first
    },
    utcDuration: {
      enumerable: false,
      value: duration
    }
  })

  return recur

  function duration() {
    return dur !== undefined ? dur : (dur =
      recur.duration
        ? typeof recur.duration === 'number'
          ? recur.duration * 1000
          : t.durationMs(recur.duration)
        : (recur.dtend
          ? (t.localToUTC(isDate('DTEND', recur.dtend)).getTime() - t.localToUTC(recur.dtstart).getTime())
          : 0
        )
    )
  }

  function contains(date) {
    const d = duration()
    const dt = ms(date)
    const i = iterator(dt - d)

    for (const x of i) {
      if (x > dt)
        break
      if (!d || dt < x + d)
        return true
    }
    return false
  }

  function between(start, end) {
    const i = iterator(start)
        , endTime = ms(end)
        , xs = []

    for (const x of i) {
      if (x <= endTime)
        xs.push(x)
      else
        break
    }

    return xs
  }

  function first() {
    return iterator().next().value
  }

  function iterator(start) {
    return (iter || (iter = createIterator()))(start)
  }

  function createIterator() {
    const bad = unimplemented.filter(k => r[k] != null)
    r.byday && r.byday.some(x => ('' + x).length > 2) && bad.push('byday with ordinal prefix')
    if (bad.length)
      throw new Error('Unsupported RRULE parts: ' + bad.join(', ').toUpperCase())

    const wkst = r.wkst || 'MO'
        , dayMap = t.daysMap[wkst]

    const scratch = new Date()

    const count = r.count
        , dtstart = t.localToUTC(x.dtstart)
        , dtstartTime = dtstart.getTime()
        , exdate = x.exdate && new Set(x.exdate.map(x => t.localToUTC(x).getTime()))
        , interval = r.interval || 1
        , until = r.until && t.localToUTC(r.until).getTime()
        , byday = r.byday ? r.byday : [t.days[dtstart.getUTCDay()]]

    const y0 = dtstart.getUTCFullYear()
        , m0 = dtstart.getUTCMonth()
        , anchorDay = dtstart.getUTCDate()
        , tod = dtstart.getUTCHours() * t.h + dtstart.getUTCMinutes() * t.m +
                dtstart.getUTCSeconds() * t.s + dtstart.getUTCMilliseconds()

    const freqs = {
      SECONDLY  : secondly(t.s),
      MINUTELY  : secondly(t.m),
      HOURLY    : secondly(t.h),
      DAILY     : secondly(t.d),
      WEEKLY,
      MONTHLY,
      YEARLY
    }

    const freq = freqs[r.freq]
        , weekly = r.freq === 'WEEKLY'
        , bydays = r.freq === 'DAILY' && r.byday ? r.byday.reduce((acc, d) => (acc[t.days.indexOf(('' + d).slice(-2))] = true, acc), []) : null
        , empty = !!bydays && !(bydays && (interval % 7 === 0 ? [dow(dtstartTime)] : [0, 1, 2, 3, 4, 5, 6])).some(d => bydays[d])
        , days = byday.map(x => dayMap[x]).sort()
        , firstDay = days[0] * t.d

    const stride = !count && !exdate && (
        r.freq === 'SECONDLY' ? t.s * interval
      : r.freq === 'MINUTELY' ? t.m * interval
      : r.freq === 'HOURLY'   ? t.h * interval
      : r.freq === 'DAILY'    ? t.d * interval
      : 0
    )

    const weekStride = !count && !exdate && weekly
      ? t.w * interval
      : 0

    const monthSeek = !count && !exdate && r.freq === 'MONTHLY'
        , yearSeek = !count && !exdate && r.freq === 'YEARLY'

    const nextDay = [...Array(days[days.length - 1])].reduce((acc, x, i) => {
      acc[i] = (days.find(x => x > i) - i) * t.d
      return acc
    }, {})

    return make

    function dow(ms) {
      return ((Math.floor(ms / t.d) % 7) + 11) % 7
    }

    function offset(ms) {
      scratch.setTime(ms)
      return scratch.getTimezoneOffset() * 60000
    }

    function daysInMonth(y, m) {
      const q = Math.floor(m / 12)
      y += q
      m -= q * 12
      return m === 1 && y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)
        ? 29
        : monthTable[m]
    }

    function monthOcc(y, m) {
      return Date.UTC(y, m, Math.min(anchorDay, daysInMonth(y, m))) + tod
    }

    function make(start) {
      start == null || start instanceof Date || (start = new Date(start))

      let rest = count
        , value = null
        , seeked = false
        , done

      return {
        next: () => done || next(),
        [Symbol.iterator]() { return this }
      }

      function next() {
        if (count && rest-- === 0)
          return (done = { done: true })

        const lt = start && !seeked ? seek() : advance()

        return lt === null
          ? (done = { done: true })
          : { done: false, value: lt }
      }

      function seek() {
        seeked = true

        const startTime = start.getTime()

        if (stride || weekStride) {
          const s = stride || weekStride
          const gap = startTime - (dtstartTime + offset(dtstartTime))
          if (gap > s) {
            const jumps = Math.floor(gap / s) - 2
            if (jumps > 0)
              value = dtstartTime + jumps * s
          }
        } else if (monthSeek) {
          const months = (start.getFullYear() - y0) * 12 + start.getMonth() - m0
          const cycles = Math.floor(months / interval) - 2
          if (cycles > 0)
            value = monthOcc(y0, m0 + cycles * interval)
        } else if (yearSeek) {
          const cycles = Math.floor((start.getFullYear() - y0) / interval) - 2
          if (cycles > 0)
            value = monthOcc(y0 + cycles * interval, m0)
        }

        let lt = advance()
        while (lt !== null && lt < startTime) {
          if (count && rest-- === 0)
            return null
          lt = advance()
        }
        return lt
      }

      function advance() {
        if (empty)
          return null

        while (true) {
          value = value === null
            ? initial()
            : freq
              ? freq(value)
              : null

          if (value === null || (until && value > until))
            return null

          if (bydays && !bydays[dow(value)])
            continue

          if (exdate && exdate.has(value))
            continue

          return value + offset(value)
        }
      }

      function initial() {
        return weekly && days.indexOf(dayMap[dow(dtstartTime)]) === -1
          ? WEEKLY(dtstartTime)
          : dtstartTime
      }
    }

    function secondly(ms) {
      const step = ms * interval
      return v => v + step
    }

    function WEEKLY(v) {
      const day = dayMap[dow(v)]

      return v + (
        nextDay[day] ||
        -day * t.d + t.w * interval + firstDay
      )
    }

    function MONTHLY(v) {
      scratch.setTime(v)
      return monthOcc(scratch.getUTCFullYear(), scratch.getUTCMonth() + interval)
    }

    function YEARLY(v) {
      scratch.setTime(v)
      return monthOcc(scratch.getUTCFullYear() + interval, m0)
    }
  }
}
