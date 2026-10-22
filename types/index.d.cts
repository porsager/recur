/**
 * CommonJS type definitions for `recur` (`require('recur')`).
 *
 * The CommonJS build exports the {@link Recur} function itself. All types
 * are available on the `Recur` namespace, e.g. `Recur.Recurrence`.
 *
 * Requires TypeScript 5.3 or newer.
 *
 * @packageDocumentation
 */

import type * as R from './index.js' with { 'resolution-mode': 'import' }

/** @inheritDoc R.default */
declare const Recur: typeof R.default

declare namespace Recur {
  export type Weekday = R.Weekday
  export type ByDay = R.ByDay
  export type Frequency = R.Frequency
  export type DateLike = R.DateLike
  export type Duration = R.Duration
  export type RRuleOptions = R.RRuleOptions
  export type RecurOptions = R.RecurOptions
  export type RRule = R.RRule
  export type RecurIterator = R.RecurIterator
  export type Recurrence = R.Recurrence
  export type Time = R.Time
}

export = Recur
