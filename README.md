# Recur

Recurrence with `VEVENT`s and `RRULE`s.

Currently only supports `DTSTART`, `DTEND`, `EXDATE`, `FREQ`, `WKST`, `INTERVAL`, `UNTIL`, `COUNT`
 - `WEEKLY` with `BYDAY` and `INTERVAL`.
 - `MONTHLY` with `INTERVAL`.
 - `SECONDLY`, `MINUTELY`, `HOURLY`, and `DAILY` with `INTERVAL`

### MONTHLY QUIRCK
MONTHLY doesn't follow the spec right now but instead behaves like RSCALE with SKIP=backwards (https://datatracker.ietf.org/doc/html/rfc7529#section-4)
If the other feature (spec) SKIP=OMIT is needed it must be implemented, but off spec behaviour will stay not to break future users.