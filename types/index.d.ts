/**
 * Type definitions for `recur`.
 *
 * Recurrence expansion for iCalendar (RFC 5545) `VEVENT`s and `RRULE`s.
 *
 * All timestamps produced by recur are plain millisecond numbers (as returned
 * by `Date.prototype.getTime()`) in the host's local time zone. Date-times in
 * iCalendar input are treated as "floating" (zoneless) local time.
 *
 * Requires TypeScript 5.1 or newer (accessors with differing get/set types).
 *
 * @packageDocumentation
 */

/**
 * A two-letter iCalendar weekday code.
 */
export type Weekday = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA'

/**
 * A `BYDAY` entry: either a plain weekday (`'MO'`) or a weekday with an
 * ordinal prefix (`'2MO'`, `'-1FR'`, `'+3TU'`).
 *
 * Ordinal prefixes are accepted, stored and serialised, but are not yet
 * supported when expanding occurrences (iteration throws).
 */
export type ByDay = Weekday | `${number}${Weekday}`

/**
 * Recurrence frequency (`FREQ`).
 */
export type Frequency =
  | 'SECONDLY'
  | 'MINUTELY'
  | 'HOURLY'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'YEARLY'

/**
 * A value accepted wherever recur takes a point in time: a `Date` instance or
 * a millisecond timestamp. Numbers are converted with `new Date(n)`; invalid
 * dates throw.
 */
export type DateLike = Date | number

/**
 * A parsed iCalendar `DURATION` value (RFC 5545 §3.3.6), as produced by
 * {@link Time.fromDuration}.
 *
 * Note that `years` and `months` are kept for round-tripping only; they are
 * ignored when the duration is converted to milliseconds.
 */
export interface Duration {
  /** Sign of the duration. `'-'` makes the duration negative. */
  sign: '+' | '-'
  /** Number of years (`nY`). Ignored by {@link Time.durationMs}. */
  years: number
  /** Number of months (`nM` before `T`). Ignored by {@link Time.durationMs}. */
  months: number
  /** Number of weeks (`nW`). */
  weeks: number
  /** Number of days (`nD`). A day is always counted as 24 hours. */
  days: number
  /** Number of hours (`nH`). */
  hours: number
  /** Number of minutes (`nM` after `T`). */
  minutes: number
  /** Number of seconds (`nS`). */
  seconds: number
}

/**
 * Recurrence rule parts (`RRULE`) used when creating a recurrence from an
 * object. Keys are the lower-cased RFC 5545 rule part names.
 *
 * Currently only `freq`, `interval`, `count`, `until`, `wkst`, and `byday`
 * (without ordinal prefix, for `WEEKLY` and `DAILY`) affect iteration. The
 * remaining `BY*` parts are validated and serialised, but iterating a rule
 * that uses any of them throws `Unsupported RRULE parts: ...`.
 */
export interface RRuleOptions {
  /**
   * `FREQ` – how often the event repeats. When omitted, the recurrence only
   * yields `dtstart`.
   */
  freq?: Frequency
  /**
   * `INTERVAL` – repeat every n-th `freq` period. Integer between 1 and
   * 2147483647. Defaults to 1.
   */
  interval?: number
  /**
   * `COUNT` – total number of occurrences, counted from `dtstart`. Dates
   * removed by `exdate` do not count towards it. Integer between 1 and
   * 2147483647.
   */
  count?: number
  /** `UNTIL` – last possible occurrence start (inclusive). */
  until?: DateLike
  /** `BYSECOND` – integers 0–60. Not supported by iteration yet. */
  bysecond?: number[]
  /** `BYMINUTE` – integers 0–59. Not supported by iteration yet. */
  byminute?: number[]
  /** `BYHOUR` – integers 0–23. Not supported by iteration yet. */
  byhour?: number[]
  /**
   * `BYDAY` – weekdays. Used by `WEEKLY` (the days of each week to occur on)
   * and `DAILY` (filters days); ignored by other frequencies. For `WEEKLY`
   * it defaults to the weekday of `dtstart`. Entries with an ordinal prefix
   * make iteration throw.
   */
  byday?: ByDay[]
  /** `BYMONTHDAY` – integers -31…-1 or 1…31. Not supported by iteration yet. */
  bymonthday?: number[]
  /** `BYYEARDAY` – integers -366…-1 or 1…366. Not supported by iteration yet. */
  byyearday?: number[]
  /** `BYWEEKNO` – integers -53…-1 or 1…53. Not supported by iteration yet. */
  byweekno?: number[]
  /** `BYMONTH` – integers 1–12. Not supported by iteration yet. */
  bymonth?: number[]
  /** `WKST` – the day a week starts on. Defaults to `'MO'`. */
  wkst?: Weekday
  /** `BYSETPOS` – integers -366…-1 or 1…366. Not supported by iteration yet. */
  bysetpos?: number[]
}

/**
 * Event properties used when creating a recurrence from an object. Keys are
 * the lower-cased iCalendar property names.
 *
 * Any additional properties (e.g. `summary`, `uid`) are copied onto the
 * returned {@link Recurrence} and included by `toString()` as
 * `KEY:value` lines, with the key upper-cased and `_` replaced by `-`.
 */
export interface RecurOptions {
  /** `DTSTART` – start of the first occurrence. */
  dtstart: DateLike
  /**
   * `DTEND` – end of the first occurrence. Must not be before `dtstart`.
   * Defines the duration of every occurrence. Mutually exclusive with
   * `duration`.
   */
  dtend?: DateLike
  /**
   * `DURATION` – length of each occurrence, either as a {@link Duration}
   * object or as a number of **seconds**. Mutually exclusive with `dtend`.
   *
   * Note: `toString()` only serialises {@link Duration} objects correctly; a
   * numeric duration is written as `PT0S`.
   */
  duration?: Duration | number
  /** `EXDATE` – occurrence start times to exclude. */
  exdate?: DateLike[]
  /** `RRULE` – the recurrence rule. */
  rrule?: RRuleOptions
}

/**
 * Live, validating view of a recurrence rule. Every setter validates its
 * value (throwing an `Error` naming the rule part on invalid input) and
 * invalidates any cached iteration state of the owning {@link Recurrence}.
 *
 * Getters return `undefined` for parts that are not set.
 */
export interface RRule {
  /** `FREQ`. Throws unless one of the {@link Frequency} values. */
  get freq(): Frequency | undefined
  set freq(value: Frequency | undefined)

  /** `INTERVAL`. Throws unless an integer between 1 and 2147483647. */
  get interval(): number | undefined
  set interval(value: number | undefined)

  /** `COUNT`. Throws unless an integer between 1 and 2147483647. */
  get count(): number | undefined
  set count(value: number | undefined)

  /** `UNTIL`. Numbers are converted to `Date`; throws on invalid dates. */
  get until(): Date | undefined
  set until(value: DateLike | undefined)

  /** `BYSECOND`. Each entry must be an integer 0–60. */
  get bysecond(): number[] | undefined
  set bysecond(value: number[])

  /** `BYMINUTE`. Each entry must be an integer 0–59. */
  get byminute(): number[] | undefined
  set byminute(value: number[])

  /** `BYHOUR`. Each entry must be an integer 0–23. */
  get byhour(): number[] | undefined
  set byhour(value: number[])

  /**
   * `BYDAY`. Each entry must end in a {@link Weekday}; ordinal prefixes are
   * preserved as given.
   */
  get byday(): ByDay[] | undefined
  set byday(value: ByDay[])

  /** `BYMONTHDAY`. Each entry must be an integer -31…-1 or 1…31. */
  get bymonthday(): number[] | undefined
  set bymonthday(value: number[])

  /** `BYYEARDAY`. Each entry must be an integer -366…-1 or 1…366. */
  get byyearday(): number[] | undefined
  set byyearday(value: number[])

  /** `BYWEEKNO`. Each entry must be an integer -53…-1 or 1…53. */
  get byweekno(): number[] | undefined
  set byweekno(value: number[])

  /** `BYMONTH`. Each entry must be an integer 1–12. */
  get bymonth(): number[] | undefined
  set bymonth(value: number[])

  /** `WKST`. Throws unless a {@link Weekday}. */
  get wkst(): Weekday | undefined
  set wkst(value: Weekday | undefined)

  /** `BYSETPOS`. Each entry must be an integer -366…-1 or 1…366. */
  get bysetpos(): number[] | undefined
  set bysetpos(value: number[])
}

/**
 * An iterator over occurrence start times (millisecond timestamps, local
 * time), in ascending order. It is also iterable, so it can be used with
 * `for...of` and spread – but beware of unbounded rules.
 *
 * Once exhausted it keeps returning `{ done: true }`.
 */
export interface RecurIterator extends IterableIterator<number> {
  next(): IteratorResult<number, undefined>
  [Symbol.iterator](): RecurIterator
}

/**
 * A recurring event created by {@link Recur}.
 *
 * Event properties are exposed as validating accessors; changing any of them
 * invalidates cached iteration state. The methods are non-enumerable.
 */
export interface Recurrence {
  /**
   * `DTSTART` – start of the first occurrence. `undefined` only if the parsed
   * iCalendar text had no `DTSTART`.
   *
   * Setting it accepts a `Date` or timestamp (throws on invalid dates). If
   * `dtend` is set and would end up before the new start, `dtend` is moved so
   * the occurrence keeps its duration.
   */
  get dtstart(): Date
  set dtstart(value: DateLike)

  /**
   * `DTEND` – end of the first occurrence.
   *
   * Setting it accepts a `Date` or timestamp, throws if it is before
   * `dtstart`, and clears `duration`.
   */
  get dtend(): Date | undefined
  set dtend(value: DateLike)

  /**
   * `DURATION` – a {@link Duration} object or a number of seconds.
   *
   * Setting it (including to `undefined`) clears `dtend`.
   */
  get duration(): Duration | number | undefined
  set duration(value: Duration | number | undefined)

  /**
   * `EXDATE` – excluded occurrence start times.
   *
   * The getter always returns an array (creating an empty one if needed).
   * Assign a new array to change it: in-place mutation of the returned array
   * does not invalidate cached iteration state. Assigning an empty array
   * removes `EXDATE` entirely.
   */
  get exdate(): Date[]
  set exdate(value: DateLike[])

  /** The recurrence rule. See {@link RRule}. */
  readonly rrule: RRule

  /**
   * Serialise the event to iCalendar content lines (`DTSTART`, `DTEND`,
   * `DURATION`, `EXDATE`, any extra properties, and `RRULE` last), joined
   * with CRLF and folded at 75 octets. Date-times are written zoneless,
   * e.g. `DTSTART:20250101T090000`.
   */
  toString(): string

  /**
   * Create a new iterator over occurrence start times.
   *
   * Each call returns an independent iterator, so several can be used
   * concurrently on the same recurrence.
   *
   * @param start Only yield occurrences starting at or after this time.
   *   `COUNT` is still counted from `dtstart`. Defaults to `dtstart`.
   * @throws {Error} If the rule uses parts that are not yet supported.
   */
  iterator(start?: DateLike): RecurIterator

  /**
   * Get all occurrence start times between `start` and `end`, both
   * inclusive.
   *
   * @param start Earliest occurrence start to include.
   * @param end Latest occurrence start to include.
   * @returns Millisecond timestamps (local time), ascending.
   * @throws {Error} If the rule uses parts that are not yet supported.
   */
  between(start: DateLike, end: DateLike): number[]

  /**
   * Whether `date` falls within an occurrence, i.e. within
   * `[occurrenceStart, occurrenceStart + duration)`. With no duration it is
   * only `true` when `date` is exactly an occurrence start.
   *
   * Answers are cached per time span until the recurrence is modified, so
   * repeated calls with nearby times are cheap.
   *
   * @throws {Error} If the rule uses parts that are not yet supported.
   */
  contains(date: DateLike): boolean

  /**
   * Get the first occurrence start time (millisecond timestamp, local time),
   * or `undefined` if the rule yields no occurrences.
   *
   * @throws {Error} If the rule uses parts that are not yet supported.
   */
  first(): number | undefined

  /**
   * The length of every occurrence in milliseconds. Computed from
   * `duration` if set (numbers are seconds; years and months are ignored),
   * otherwise from `dtend - dtstart` (in UTC, unaffected by DST), otherwise
   * `0`. The result is cached until the recurrence is modified.
   */
  utcDuration(): number
}

/**
 * Time helpers and constants used internally by recur, exported as `t`.
 */
export interface Time {
  /** Milliseconds in a second (`1000`). */
  readonly s: number
  /** Milliseconds in a minute (`60000`). */
  readonly m: number
  /** Milliseconds in an hour (`3600000`). */
  readonly h: number
  /** Milliseconds in a 24-hour day (`86400000`). */
  readonly d: number
  /** Milliseconds in a 7-day week (`604800000`). */
  readonly w: number

  /**
   * Weekday codes indexed like `Date.prototype.getDay()` (Sunday = 0).
   */
  readonly days: readonly ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

  /**
   * Weekday offsets relative to a week start.
   *
   * `daysMap[wkst][day]` is the number of days `day` lies after `wkst`
   * (0–6). `day` may be a {@link Weekday} or a `getDay()` index.
   *
   * @example
   * t.daysMap.MO.SU // 6
   * t.daysMap.MO[0] // 6
   */
  readonly daysMap: Readonly<Record<Weekday, Readonly<Record<Weekday | number, number>>>>

  /**
   * Parse an iCalendar `DURATION` string such as `PT30M`, `-P1W` or
   * `P1DT2H`. A `,` is accepted as decimal separator.
   */
  fromDuration(value: string): Duration

  /**
   * Convert a {@link Duration} to milliseconds. `years` and `months` are
   * ignored; days are 24 hours.
   */
  durationMs(value: Partial<Duration>): number

  /**
   * Serialise a {@link Duration} to an iCalendar `DURATION` string. An empty
   * duration becomes `PT0S`.
   */
  toDuration(value: Partial<Duration>): string

  /**
   * Split an iCalendar `DATE` (`YYYYMMDD`) or `DATE-TIME`
   * (`YYYYMMDDTHHMMSS`, optionally followed by `Z` or an offset, which is
   * discarded) into `[year, monthIndex, day, hours, minutes, seconds]`.
   * Months are 0-indexed; a leap second (`60`) becomes `59`.
   *
   * @throws {TypeError} If the string is not in one of those formats.
   */
  parse(value: string): [number, number, number, number, number, number]

  /**
   * Shift a `Date` whose UTC fields hold a wall-clock time so that its local
   * fields hold that time instead.
   */
  UTCToLocal(date: Date): Date

  /**
   * Shift a `Date` so that its UTC fields equal its current local fields.
   */
  localToUTC(date: Date): Date

  /**
   * Parse an iCalendar date or date-time string as a UTC `Date`.
   */
  zonelessToUTC(value: string): Date

  /**
   * Parse an iCalendar date or date-time string as a local-time `Date`.
   */
  zonelessToLocal(value: string): Date

  /**
   * Format the UTC fields of a `Date` as a zoneless iCalendar date-time
   * (`YYYYMMDDTHHMMSS`).
   *
   * @param date Defaults to now.
   */
  UTCToZoneless(date?: Date): string

  /**
   * Format the local fields of a `Date` as a zoneless iCalendar date-time
   * (`YYYYMMDDTHHMMSS`).
   *
   * @param date Defaults to now.
   */
  localToZoneless(date?: Date): string

  /**
   * ISO 8601 week number (1–53) of a date, using local time.
   */
  weekNumber(date: Date | number | string): number

  /**
   * Day of the year (1–366) of a date, using its UTC fields.
   */
  yearDay(date: Date): number
}

/**
 * Create a recurrence from iCalendar text.
 *
 * Content lines are unfolded and `DTSTART`, `DTEND`, `DURATION`, `EXDATE`
 * and `RRULE` are read; all other properties are ignored. Parameters such
 * as `;VALUE=DATE` are accepted. Date-times are interpreted as local time
 * (any `Z` suffix or `TZID` is ignored).
 *
 * @example
 * const r = Recur('DTSTART:20250101T090000\nDURATION:PT30M\nRRULE:FREQ=WEEKLY;BYDAY=MO,WE')
 * r.between(new Date(2025, 0, 1), new Date(2025, 1, 1))
 *
 * @param input An iCalendar `VEVENT` body (or just its relevant lines).
 * @throws {Error} If a parsed value is invalid.
 */
declare function Recur(input: string): Recurrence

/**
 * Create a recurrence from an object.
 *
 * Values are validated as they are set; invalid values throw an `Error`
 * naming the offending property. Any extra properties are copied onto the
 * result and included in `toString()`.
 *
 * @example
 * const r = Recur({
 *   dtstart: new Date(2025, 0, 1, 9),
 *   dtend: new Date(2025, 0, 1, 9, 30),
 *   rrule: { freq: 'DAILY', interval: 2, count: 10 }
 * })
 * r.contains(new Date(2025, 0, 3, 9, 15)) // true
 *
 * @param input Event properties and recurrence rule. The object is copied,
 *   not mutated.
 * @throws {Error} If any value is invalid.
 */
declare function Recur<T extends RecurOptions>(input: T): Recurrence & Omit<T, keyof RecurOptions>

export default Recur

/** Time helpers and constants. See {@link Time}. */
export declare const t: Time