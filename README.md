# 🔁 Recur

- 📅 iCalendar `VEVENT` & `RRULE` recurrence ([RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545))
- 🏃 Lazy iterators that fast-forward instead of walking every occurrence
- ⚡️ Cached `contains` lookups for hot paths like "is it open right now?"
- 🔄 Parse ⇄ modify ⇄ stringify round-trips
- 🪶 Zero dependencies, ESM & CommonJS
- 🐦 Follow on [Twitter](https://twitter.com/rporsager)

<br>

# Installation

```bash
$ <sin|npm|pnpm> install recur
```

# Usage

Create a recurrence from an iCalendar string

```js
import Recur from 'recur'

const standup = Recur(`
DTSTART:20250106T090000
DTEND:20250106T091500
RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR
`)

standup.first()
// => 1736154000000 (Mon Jan 06 2025 09:00)

standup.between(new Date(2025, 0, 6), new Date(2025, 0, 12))
// => [Mon 6th 09:00, Wed 8th 09:00, Fri 10th 09:00] as ms timestamps

standup.contains(new Date(2025, 0, 8, 9, 10))
// => true
```

Or from a plain object

```js
const rent = Recur({
  dtstart : new Date(2025, 0, 31, 10),
  rrule   : {
    freq     : 'MONTHLY',
    interval : 1
  }
})

rent.toString()
// => 'DTSTART:20250131T100000\r\nRRULE:FREQ=MONTHLY;INTERVAL=1'
```

# Table of Contents

* [Creating a recurrence](#creating-a-recurrence)
* [Querying occurrences](#querying-occurrences)
* [Modifying a recurrence](#modifying-a-recurrence)
* [Durations](#durations)
* [Time zones](#time-zones)
* [Supported RRULE parts](#supported-rrule-parts)
* [Quirks](#quirks)
* [Time helpers](#time-helpers)
* [Error handling](#error-handling)

# Creating a recurrence

## `Recur(input) -> recur`

`input` can be either an iCalendar string or an object.

## From a string

Pass the lines of a `VEVENT`. Lines can be separated by `\n` or `\r\n`, folded lines are unfolded, and properties Recur doesn't know about (`SUMMARY`, `UID`, `BEGIN:VEVENT`, ...) are simply ignored, so you can usually pass a full event straight from an `.ics` file.

```js
const v = Recur(`
DTSTART:20210119T090000
DURATION:PT1H
EXDATE:20210124T090000
RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=SU,MO;WKST=MO
`)
```

The following `VEVENT` properties are read

```
DTSTART   : Start of the first occurrence
DTEND     : End of the first occurrence
DURATION  : Length of each occurrence (alternative to DTEND)
EXDATE    : Comma separated list of excluded occurrences
RRULE     : The recurrence rule
```

> All-day dates like `DTSTART;VALUE=DATE:20250101` are supported and become midnight.

## From an object

Keys are the lowercased iCalendar names. Dates can be `Date` instances or ms timestamps.

```js
const v = Recur({
  dtstart  : new Date(2025, 0, 1, 9),          // Date or ms timestamp
  dtend    : new Date(2025, 0, 1, 10),         // Date or ms timestamp
  duration : { hours: 1 },                     // Or seconds as a number - use instead of dtend
  exdate   : [new Date(2025, 0, 8, 9)],        // Array of Dates
  rrule    : {
    freq     : 'WEEKLY',                       // SECONDLY | MINUTELY | HOURLY | DAILY | WEEKLY | MONTHLY | YEARLY
    interval : 1,                              // Every n'th freq
    count    : 10,                             // Stop after n occurrences
    until    : new Date(2025, 11, 31),         // Stop after this date (inclusive)
    byday    : ['MO', 'WE'],                   // SU | MO | TU | WE | TH | FR | SA
    wkst     : 'MO'                            // Week start, defaults to MO
  }
})
```

> Leaving out `rrule` gives you a single occurrence at `dtstart`.

# Querying occurrences

All occurrences are returned as ms timestamps (`Number`) — wrap them in `new Date(x)` if you need a `Date`.

## `recur.first() -> Number`

Returns the first occurrence.

```js
const v = Recur({
  dtstart : new Date(2025, 0, 1, 9), // Wednesday
  rrule   : { freq: 'WEEKLY', byday: ['FR'] }
})

new Date(v.first())
// => Fri Jan 03 2025 09:00
```

A handy trick is to snap `dtstart` to the first actual occurrence

```js
v.dtstart = v.first()
```

## `recur.between(start, end) -> Number[]`

Returns all occurrences from `start` up to and including `end`.

```js
const v = Recur('DTSTART:20250101T090000\nRRULE:FREQ=DAILY')

v.between(new Date(2025, 0, 1), new Date(2025, 0, 31)).length
// => 31
```

## `recur.contains(date) -> Boolean`

Returns `true` if `date` falls inside an occurrence, meaning from its start up to (but not including) its end as given by `DTEND` or `DURATION`.

```js
const shop = Recur({
  dtstart : new Date(2025, 0, 6, 10),
  dtend   : new Date(2025, 0, 6, 18),
  rrule   : { freq: 'WEEKLY', byday: ['MO', 'TU', 'WE', 'TH', 'FR'] }
})

shop.contains(new Date(2025, 0, 8, 17, 59)) // => true
shop.contains(new Date(2025, 0, 8, 18, 0))  // => false
shop.contains(new Date(2025, 0, 11, 12))    // => false (Saturday)
```

Without a duration `contains` only matches the exact start of an occurrence.

> [!NOTE]
> The answer is cached for the span of time where it can't change, so calling `contains` repeatedly with something
> like `Date.now()` is very cheap. The cache is reset whenever the recurrence is modified.

## `recur.iterator([start]) -> Iterator`

Returns a lazy iterator of occurrences, beginning at the first occurrence on or after `start` (or `DTSTART` if left out). Each call creates an independent iterator, so you can have several going at once.

```js
const v = Recur('DTSTART:20250101T090000\nRRULE:FREQ=HOURLY;INTERVAL=4')

for (const x of v.iterator(new Date(2025, 5, 1))) {
  if (x > someLimit)
    break
  // ...
}
```

Unless there's a `COUNT` or `EXDATE` involved, the iterator jumps straight to `start` instead of stepping through every occurrence since `DTSTART`, so querying far into the future of a `SECONDLY` rule is as fast as querying tomorrow.

> [!NOTE]
> Recurrences without `COUNT` or `UNTIL` are infinite — make sure you `break` out of loops.

## `recur.utcDuration() -> Number`

Returns the length of each occurrence in ms, calculated from `DURATION` or from `DTEND - DTSTART`. Returns `0` if neither is set.

## `recur.toString() -> String`

Serializes back to iCalendar format with `\r\n` line endings and lines folded at 75 characters, as required by the spec.

```js
const v = Recur({ dtstart: new Date(2025, 0, 1, 9) })
v.rrule.freq = 'DAILY'
v.rrule.count = 5

v.toString()
// => 'DTSTART:20250101T090000\r\nRRULE:FREQ=DAILY;COUNT=5'
```

# Modifying a recurrence

Every property is a getter / setter, so you can modify the recurrence in place. Values are validated as they're set, and any cached iterators or `contains` results are invalidated.

```js
const v = Recur('DTSTART:20250101T090000\nRRULE:FREQ=DAILY')

v.rrule.interval = 2
v.rrule.until = new Date(2025, 1, 1)
v.exdate = [...v.exdate, new Date(2025, 0, 3, 9)]

v.rrule.count = 0
// => Error: COUNT: 0 is invalid - must be an int between 1 and 2147483647
```

A few setters adjust related properties for you

```
dtstart   : If moved past dtend, dtend is moved along to keep the same duration
dtend     : Clears duration (throws if before dtstart)
duration  : Clears dtend
exdate    : Setting an empty array removes EXDATE entirely
```

`recur.exdate` always returns an array, so pushing to it directly works too

```js
v.exdate.push(new Date(2025, 0, 5, 9))
```

> [!NOTE]
> Mutating the array in place doesn't invalidate cached results — prefer assigning a new array.

# Durations

`duration` can be set as a number of seconds, or as an object in the same shape `DURATION` is parsed into

```js
{
  sign    : '+',   // '+' or '-'
  weeks   : 0,
  days    : 0,
  hours   : 1,
  minutes : 30,
  seconds : 0
}
```

**Only the keys you need are required. Duration objects are serialized back to the iCalendar format, eg. `PT1H30M`.**

# Time zones

Recur works in floating local time. `20250101T090000` means 09:00 in the time zone of the environment running the code, and occurrences keep their wall-clock time across DST changes — a daily 09:00 event stays at 09:00 both before and after the clocks change.

`TZID` parameters and the UTC `Z` suffix are currently ignored, so `DTSTART;TZID=America/New_York:20250101T090000` is read as 09:00 local time. If you need occurrences in a specific zone, run in that zone (eg. with the `TZ` environment variable) or convert the results yourself.

## Supported RRULE parts

```
FREQ       : SECONDLY | MINUTELY | HOURLY | DAILY | WEEKLY | MONTHLY | YEARLY
INTERVAL   : All frequencies
COUNT      : All frequencies
UNTIL      : All frequencies (inclusive)
BYDAY      : WEEKLY and DAILY - plain days only (MO, not 1MO or -1FR)
WKST       : WEEKLY
```

The remaining parts (`BYSECOND`, `BYMINUTE`, `BYHOUR`, `BYMONTHDAY`, `BYYEARDAY`, `BYWEEKNO`, `BYMONTH`, `BYSETPOS` and `BYDAY` with an ordinal prefix) are parsed, validated and serialized, but aren't evaluated yet. Rather than silently producing wrong occurrences, querying a recurrence using any of them throws an [`Unsupported RRULE parts`](#unsupported-rrule-parts) error.

PRs implementing more of the spec are very welcome.

# Quirks

## MONTHLY and YEARLY clamp to the end of the month

Per the spec, a monthly rule starting on the 31st should skip months that don't have 31 days. Recur instead clamps to the last day of the month, which is what most people expect from "every month on the 31st":

```js
const v = Recur({ dtstart: new Date(2025, 0, 31, 10), rrule: { freq: 'MONTHLY' } })

v.between(new Date(2025, 0, 1), new Date(2025, 4, 1))
// => Jan 31, Feb 28, Mar 31, Apr 30
```

The same goes for yearly rules on February 29th, which fall on February 28th in non-leap years. This matches [RFC 7529](https://datatracker.ietf.org/doc/html/rfc7529#section-4) `RSCALE` with `SKIP=BACKWARD`. If spec-compliant `SKIP=OMIT` behaviour is needed it will be added as an option, but the current behaviour will stay the default so existing users aren't broken.

## EXDATE doesn't use up COUNT

Excluded dates are skipped before `COUNT` is applied, so `COUNT=6` with one `EXDATE` hit still yields 6 occurrences.

# Time helpers

The time utilities Recur uses internally are exported as `t`

```js
import { t } from 'recur'

t.s, t.m, t.h, t.d, t.w            // Milliseconds in a second, minute, hour, day, week

t.fromDuration('PT1H30M')          // => { sign: '+', hours: 1, minutes: 30, ... }
t.toDuration({ hours: 1 })         // => 'PT1H'
t.durationMs({ hours: 1 })         // => 3600000

t.zonelessToLocal('20250101T090000')    // => Date at 09:00 local time
t.zonelessToUTC('20250101T090000')      // => Date at 09:00 UTC
t.localToZoneless(new Date())           // => '20250101T090000'
t.UTCToZoneless(new Date())             // => '20250101T080000'

t.weekNumber(new Date(2025, 0, 1))      // => 1 (ISO 8601 week number)
t.yearDay(new Date(Date.UTC(2024, 1, 29))) // => 60
```

## Error handling

Errors are thrown synchronously, either when setting an invalid value or when querying a recurrence Recur can't evaluate.

### Invalid values
> FREQ: FORTNIGHTLY is invalid - must be one of SECONDLY | MINUTELY | HOURLY | DAILY | WEEKLY | MONTHLY | YEARLY

Setters validate their input, and the message always starts with the iCalendar name of the property that failed, followed by what's allowed. Numbers must be integers within the ranges of the spec (eg. `BYMONTHDAY` between `-31` and `-1` or `1` and `31`), and dates must be valid `Date` instances or ms timestamps.

### DTEND before DTSTART
> DTEND = ... can not be lower than DTSTART = ...

An occurrence can't end before it starts. Set `dtstart` first if you're moving both.

### Unsupported RRULE parts
> Unsupported RRULE parts: BYMONTHDAY

Thrown by `first`, `between`, `contains` and `iterator` when the rule uses a part that isn't evaluated yet. See [Supported RRULE parts](#supported-rrule-parts).

## License

[WTFPL](http://www.wtfpl.net/)