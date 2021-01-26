import { t, o } from 'fantestic'
import time from '../src/time.js'
import recur from '../src/index.js'


const v = recur(`DTSTART:20210119T090000
EXDATE:20210124T090000
RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=SU,MO;WKST=MO
`)
    , from = new Date()
    , to = new Date(from.getTime() + time.w * 416321)

let start = Date.now()
const xs = v.between(from, to)
p(Date.now() - start)
p(xs[0], xs[xs.length - 1], xs.length)


t('iterator works', () => {
  const v = recur(
    'DTSTART:19900106T220000\nDTEND:19900106T220500\nRRULE:FREQ=WEEKLY;BYDAY=SA'
  )

  return [
    v.iterator().next().value.getTime(),
    new Date(1990, 0, 6, 22).getTime()
  ]
})

t('iterator works with count', () => {
  const v = recur(
    'DTSTART:19900106T220000\nDTEND:19900106T220500\nRRULE:FREQ=WEEKLY;BYDAY=SA;COUNT=1'
  )

  const i = v.iterator()

  return [
    [i.next().done, i.next().done].join(''),
    'falsetrue'
  ]
})

t('toString', () => {
  const v = recur(
    'DTSTART:19900106T220000\nDTEND:19900106T220500\nRRULE:FREQ=WEEKLY;BYDAY=SA'
  )

  return [
    'DTSTART:19900106T220000\nDTEND:19900106T220500\nRRULE:FREQ=WEEKLY;BYDAY=SA',
    v.toString()
  ]
})

t('iterator with start works', () => {
  const v = recur(
    'DTSTART:20200106T220000\nDTEND:20200106T220500\nRRULE:FREQ=WEEKLY;BYDAY=SA'
  )

  return [
    v.iterator(new Date(2020, 0, 6, 22)).next().value.getTime(),
    new Date(2020, 0, 6, 22).getTime()
  ]
})

t('between works', () => {
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

t('contain works', () => {
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

t('first works', () => {
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
