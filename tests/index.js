import t from 'sin/test'
import time from '../src/time.js'
import recur from '../src/index.js'

t`iterator works`(() => {
  const v = recur(
    'DTSTART:19900106T220000\nDTEND:19900106T220500\nRRULE:FREQ=WEEKLY;BYDAY=SA'
  )

  return [
    v.iterator().next().value.getTime(),
    new Date(1990, 0, 6, 22).getTime()
  ]
})

t`iterator works with count`(() => {
  const v = recur(
    'DTSTART:19900106T220000\nDTEND:19900106T220500\nRRULE:FREQ=WEEKLY;BYDAY=SA;COUNT=1'
  )

  const i = v.iterator()

  return [
    [i.next().done, i.next().done].join(''),
    'falsetrue'
  ]
})

t`toString`(() => {
  const v = recur(
    'DTSTART:19900106T220000\nDTEND:19900106T220500\nRRULE:FREQ=WEEKLY;BYDAY=SA'
  )

  return [
    'DTSTART:19900106T220000\nDTEND:19900106T220500\nRRULE:FREQ=WEEKLY;BYDAY=SA',
    v.toString()
  ]
})

t`iterator with start works`(() => {
  const v = recur(
    'DTSTART:20200106T220000\nDTEND:20200106T220500\nRRULE:FREQ=WEEKLY;BYDAY=SA'
  )

  return [
    v.iterator(new Date(2020, 0, 6, 22)).next().value.getTime(),
    new Date(2020, 0, 6, 22).getTime()
  ]
})

t`between works`(() => {
  const v = recur({
    dtstart: new Date(2021, 0, 20, 9),
    rrule: {
      freq: 'WEEKLY'
    }
  })

  return [
    v.iterator().next().value.getTime(),
    new Date(2021, 0, 20, 9).getTime()
  ]
})

t`contain works`(() => {
  const v = recur({
    dtstart: new Date(2021, 0, 20, 9, 0),
    dtend: new Date(2021, 0, 20, 9, 30),
    rrule: {
      freq: 'WEEKLY',
      byday: ['WE']
    }
  })

  return [
    v.contains(new Date(2021, 0, 27, 9, 29, 59, 999)),
    true
  ]
})

t`contain works with multiple`(() => {
  const v = recur({
    dtstart: new Date('2023-01-02T13:00'),
    dtend: new Date('2023-01-02T17:00'),
    rrule: {
      freq: 'WEEKLY',
      byday: ['SA', 'SU']
    }
  })

  return [
    v.contains(new Date('2023-01-07T14:00')),
    true
  ]
})

t`first works`(() => {
  const v = recur({
    dtstart: new Date(2021, 0, 20, 9, 0),
    dtend: new Date(2021, 0, 20, 9, 30),
    rrule: {
      freq: 'WEEKLY',
      byday: ['WE']
    }
  })

  v.dtstart = v.first()

  return [
    v.first().getTime(),
    new Date(2021, 0, 20, 9, 0).getTime()
  ]
})


t`week between works`(() => {
  const v = recur({
    dtstart: new Date(2025, 0, 1, 1),
    rrule: {
      freq: 'WEEKLY'
    }
  })

  return [
    v.between(new Date('2025-01-01'),new Date('2025-01-20')).length,
    3
  ]
})


t`daily between a month`(() => {
  const v = recur({
    dtstart: new Date('2025-01-01T00:00:00'),
    rrule: {
      freq: 'DAILY'
    }
  })

  const xs = v.between(
      new Date('2025-01-01T00:00:00'),
      new Date('2025-01-31T00:00:00')
    )

  return [
    xs.length,
    31
  ]
})

t`monthly between`(() => {
  const v = recur({
    dtstart: new Date('2025-01-01T00:00:00'),
    rrule: {
      freq: 'MONTHLY'
    }
  })

  const xs = v.between(
      new Date('2025-01-01T00:00:00'),
      new Date('2025-12-01T00:00:00')
    )

  return [ xs.length, 12 ]
})

t`quartely (monthly between with interval 3)`(() => {
  const v = recur({
    dtstart: new Date(2025, 0, 1, 1),
    rrule: {
      freq: 'MONTHLY',
      interval: 3
    }
  })

  return [ v.between(new Date('2025-01-01'),new Date('2025-12-31')).length, 4]
})

t`single event`(() => {
  const v = recur({
    dtstart: new Date(2025, 0, 1, 1)
  })

  return [ v.between(new Date('2025-01-01'),new Date('2025-12-31')).length, 1]
})

t`daily fast-forward lands on exact occurrence`(() => {
  const v = recur({
    dtstart: new Date(2020, 0, 1, 9),
    rrule: {
      freq: 'DAILY'
    }
  })
  return [
    v.iterator(new Date(2026, 4, 1, 0)).next().value.getTime(),
    new Date(2026, 4, 1, 9).getTime()
  ]
})

t`daily with interval fast-forward stays on cycle`(() => {
  const v = recur({
    dtstart: new Date(2020, 0, 1, 9),
    rrule: {
      freq: 'DAILY',
      interval: 3
    }
  })
  const first = v.iterator(new Date(2025, 0, 1)).next().value.getTime()
  return [
    (first - new Date(2020, 0, 1, 9).getTime()) % (time.d * 3),
    0
  ]
})

t`hourly fast-forward count over a day`(() => {
  const v = recur({
    dtstart: new Date(2024, 0, 1, 8, 30),
    rrule: {
      freq: 'HOURLY'
    }
  })
  return [
    v.between(new Date(2024, 0, 1, 8, 30), new Date(2024, 0, 2, 8, 30)).length,
    25
  ]
})

t`weekly fast-forward single day`(() => {
  const v = recur({
    dtstart: new Date(2020, 0, 6, 12),
    rrule: {
      freq: 'WEEKLY',
      byday: ['MO']
    }
  })
  return [
    v.iterator(new Date(2026, 4, 1)).next().value.getDay(),
    1
  ]
})

t`weekly interval 2 multi-day fast-forward`(() => {
  const v = recur({
    dtstart: new Date(2020, 0, 1, 12),
    rrule: {
      freq: 'WEEKLY',
      interval: 2,
      byday: ['MO', 'WE', 'FR']
    }
  })
  return [
    [1, 3, 5].includes(v.iterator(new Date(2025, 5, 1)).next().value.getDay()),
    true
  ]
})

t`weekly between count`(() => {
  const v = recur({
    dtstart: new Date(2025, 0, 6, 9),
    rrule: {
      freq: 'WEEKLY',
      byday: ['MO']
    }
  })
  return [
    v.between(new Date(2025, 0, 6), new Date(2025, 2, 31)).length,
    12
  ]
})

t`exdate excludes the right occurrence`(() => {
  const v = recur(
    'DTSTART:20210119T090000\nEXDATE:20210124T090000\nRRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=SU,MO;WKST=MO\n'
  )
  return [
    v.between(new Date(2021, 0, 19), new Date(2021, 1, 10)).some(d =>
      d.getTime() === new Date(2021, 0, 24, 9).getTime()
    ),
    false
  ]
})

t`reused instance matches fresh instance`(() => {
  const mk = () => recur({
    dtstart: new Date(2020, 0, 1, 9),
    rrule: {
      freq: 'DAILY'
    }
  })
  const reused = mk()
  reused.iterator(new Date(2021, 0, 1)).next()
  reused.between(new Date(2022, 0, 1), new Date(2022, 0, 10))
  return [
    reused.iterator(new Date(2023, 0, 1)).next().value.getTime(),
    mk().iterator(new Date(2023, 0, 1)).next().value.getTime()
  ]
})

t`concurrent iterators on one instance stay independent`(() => {
  const v = recur({
    dtstart: new Date(2020, 0, 1, 9),
    rrule: {
      freq: 'DAILY'
    }
  })
  const i1 = v.iterator()
  const i2 = v.iterator(new Date(2021, 0, 1))
  const a = i1.next().value.getTime()
  const b = i2.next().value.getTime()
  return [
    a < b && a === new Date(2020, 0, 1, 9).getTime(),
    true
  ]
})

t`yearDay returns correct day number`(() => {
  return [
    time.yearDay(new Date(Date.UTC(2024, 1, 29))),
    60
  ]
})

t`yearDay Jan 1 is day 1`(() => {
  return [
    time.yearDay(new Date(Date.UTC(2025, 0, 1))),
    1
  ]
})

t`daily occurrence keeps local time across DST`(() => {
  const v = recur({
    dtstart: new Date(2021, 0, 1, 9),
    rrule: {
      freq: 'DAILY'
    }
  })
  const d = v.iterator(new Date(2021, 2, 29)).next().value
  return [
    d.getHours() + ':' + d.getMinutes(),
    '9:0'
  ]
})

t`contains at exact occurrence start`(() => {
  const v = recur({
    dtstart: new Date(2025, 0, 1, 9),
    dtend: new Date(2025, 0, 1, 9, 30),
    rrule: {
      freq: 'DAILY'
    }
  })
  return [
    v.contains(new Date(2025, 0, 8, 9, 0, 0, 0)),
    true
  ]
})

t`contains at last ms of duration`(() => {
  const v = recur({
    dtstart: new Date(2025, 0, 1, 9),
    dtend: new Date(2025, 0, 1, 9, 30),
    rrule: {
      freq: 'DAILY'
    }
  })
  return [
    v.contains(new Date(2025, 0, 8, 9, 29, 59, 999)),
    true
  ]
})

t`contains is exclusive at duration end`(() => {
  const v = recur({
    dtstart: new Date(2025, 0, 1, 9),
    dtend: new Date(2025, 0, 1, 9, 30),
    rrule: {
      freq: 'DAILY'
    }
  })
  return [
    v.contains(new Date(2025, 0, 8, 9, 30, 0, 0)),
    false
  ]
})

t`count caps total occurrences`(() => {
  const v = recur('DTSTART:20200101T090000\nRRULE:FREQ=DAILY;COUNT=10')
  let n = 0
  const i = v.iterator()
  while (!i.next().done && n < 100) n++
  return [ n, 10 ]
})

t`count exhausted when seeking past all occurrences`(() => {
  const v = recur('DTSTART:20200101T090000\nRRULE:FREQ=DAILY;COUNT=10')
  return [
    v.iterator(new Date(2021, 0, 1)).next().done,
    true
  ]
})

t`until is exclusive on exact boundary`(() => {
  const v = recur('DTSTART:20250101T090000\nRRULE:FREQ=DAILY;UNTIL=20250105T090000')
  return [
    v.between(new Date(2025, 0, 1), new Date(2025, 0, 31)).length,
    4
  ]
})