// EDIT HERE to change the gate rules. See README "How to change things".
/** Outcomes where engineering was not really needed (see docs/DIAGNOSIS.md). */
export const AVOIDABLE = ["Insufficient info - returned to L1", "Config issue - returned to L1", "Duplicate of known issue", "Not a bug - how-to"];
export const MIN_SAMPLE = 5; // fewer similar tickets than this: fall back to the whole category
export const FIXED_RATE_TO_ESCALATE = 0.6; // share of past escalations engineering fixed, at or above which we say "escalate"
export const KNOWN_ISSUE_HINT_AT = 3; // show the known-issue hint after this many past duplicates

export const CHECKLISTS: Record<string, string[]> = {
  "Roster / booking not syncing": ["Confirm booking time vs the client's current cutoff setting", "Check the shift roster config for the affected shift", "Note affected employee IDs, booking IDs and the expected vs actual roster"],
  "Live tracking / GPS incorrect": ["Check the driver app version and GPS permission", "Confirm the trip ID and when the issue started", "Check whether other cabs on the same route show the same problem"],
  "Report export failing": ["Check the date range (over 15 days is a known failure)", "Try a smaller range or another format", "Check the known-issue list before escalating"],
  "OTP / boarding issue": ["Confirm the OTP is for the correct trip and shift", "Check whether the OTP expired or was regenerated", "Note trip ID and driver app version"],
  "Billing / invoice discrepancy": ["List the disputed trips against the client's records", "Check cancelled trips and dead-km rules", "Attach invoice number and period"],
  "Cab delay / no-show complaint": ["Check trip logs for driver arrival time", "Get the driver and vehicle details", "Log the employee's pickup point"],
  "Employee address / geocode change": ["Confirm the new address and pin location", "Check the effective date of the change", "Check for pending bookings on the old address"],
  "How-to / feature request": ["Check the help docs for the answer", "Log the request in the feature backlog"],
  "Login / access issue": ["Confirm the user's role and email", "Check for a recent password reset or lock", "Resend access or reset the user"],
  "Driver / vehicle compliance docs": ["Check document expiry dates", "Confirm the vehicle's current assignment", "Request updated documents"],
};

