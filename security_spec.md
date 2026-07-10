# Security Spec: Purple Canary Forensic Suite (Firestore TDD)

This document outlines the Security Specification, data invariants, and the "Dirty Dozen" attack payloads targeting the forensic database engine.

## 1. Data Invariants

1. **Scans Immutability**: Once a scan record is logged, it can never be updated or deleted by a client SDK.
2. **Access Isolation**: Clients can only write and read scan logs where the `email` field matches their local identity key.
3. **Strict Schema Constraints**: `users` and `scans` collections must enforce exact structure, field types, and size limits to prevent Denial of Wallet (resource exhaustion) attacks.
4. **Identity Binding**: Users cannot register or update profiles that do not match their active login identity.
5. **No Self-Privilege Escalation**: Users are restricted from setting their own user `tier` (e.g. escalating from 'free' to 'unlimited') or `access` level during create/update profiles.

---

## 2. The "Dirty Dozen" Payloads (Red Team Attack Vectors)

Here are the 12 malicious payloads designed to test database integrity and safety bounds:

### Vector 1: Identity Spoofing (Save scan for another user)
An attacker attempts to write a scan log pointing to an innocent user's identifier.
```json
// Collection: scans
{
  "email": "0xinnocentuserxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "date": "2026-07-10",
  "location": "Malicious Lab",
  "verdict": "CLEAN",
  "matrix": "SOLID_CRYSTAL",
  "detections": [],
  "createdAt": "2026-07-10T11:35:30.000Z"
}
```

### Vector 2: State/Record Poisoning (Large string Denial of Wallet)
An attacker tries to inject a 10MB payload into the location field to rack up storage costs.
```json
// Collection: scans
{
  "email": "0xattackerxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "date": "2026-07-10",
  "location": "A".repeat(1000000), 
  "verdict": "CLEAN",
  "matrix": "SOLID_CRYSTAL",
  "detections": [],
  "createdAt": "2026-07-10T11:35:30.000Z"
}
```

### Vector 3: Shadow Update (Injecting un-validated extra keys)
An attacker tries to append an un-validated "isVerified" or "bypass" key to the document.
```json
// Collection: scans
{
  "email": "0xattackerxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "date": "2026-07-10",
  "location": "Field Lab Alpha",
  "verdict": "CLEAN",
  "matrix": "SOLID_CRYSTAL",
  "detections": [],
  "createdAt": "2026-07-10T11:35:30.000Z",
  "bypass_validation": true
}
```

### Vector 4: Scan Tampering (Updating logged scans)
An attacker tries to modify a previously saved scan verdict to "CLEAN" to cover up illicit activities.
```json
// Operation: UPDATE on scans/{scanId}
{
  "verdict": "CLEAN"
}
```

### Vector 5: Evidence Destruction (Deleting logged scans)
An attacker tries to clear a scan trail by issuing a delete operation on a scan record.
```json
// Operation: DELETE on scans/{scanId}
```

### Vector 6: Profile Spoofing (Creating someone else's profile)
An attacker attempts to register a profile under an innocent user's key.
```json
// Collection: users, DocID: 0xinnocentuserxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
{
  "email": "0xinnocentuserxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "username": "Innocent",
  "tier": "free",
  "access": "Alpha"
}
```

### Vector 7: Tier Escalation (Self-Assigned Pro Unlimited Access)
A free-tier user tries to upgrade themselves to Pro Unlimited without completing checkout.
```json
// Collection: users, DocID: 0xattackerxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
{
  "email": "0xattackerxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "username": "Attacker",
  "tier": "unlimited",
  "access": "Pro"
}
```

### Vector 8: Orphan Profile Registrations (Profile without username)
An attacker tries to write profile data missing mandatory keys.
```json
// Collection: users, DocID: 0xattackerxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
{
  "email": "0xattackerxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "tier": "free",
  "access": "Alpha"
}
```

### Vector 9: PII Blanket Harvest (Read other user profile)
An attacker attempts to retrieve personal shipping addresses of another user.
```json
// Operation: GET on users/0xinnocentuserxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Vector 10: Bulk Log Scraping (Unfiltered list queries)
An attacker tries to retrieve all logged scans across the system.
```json
// Operation: LIST on scans (without a where query matching user email)
```

### Vector 11: Invalid ID Poisoning (Malformed document ID sizes/characters)
An attacker tries to create a document with a junk ID to flood the system indexes.
```json
// DocID: "%2F%20..%2F..%2Fjunk-characters" or excessively long string
```

### Vector 12: Bad Type Injection (Varying types to crash downstream parsers)
An attacker tries to inject numbers into string-validated fields or strings into numbers.
```json
// Collection: scans
{
  "email": "0xattackerxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "date": 12345, // invalid type
  "location": "Field Lab Alpha",
  "verdict": "CLEAN",
  "matrix": "SOLID_CRYSTAL",
  "detections": "not-an-array", // invalid type
  "createdAt": "2026-07-10T11:35:30.000Z"
}
```

---

## 3. Test Specification

All writes and reads must be evaluated against the security configurations. Our test runner validates that:
- Any unauthorized operations immediately abort with `permission-denied`.
- Valid user transactions succeed with perfect type and value matching.
- Schema verification blocks all un-vetted fields.
