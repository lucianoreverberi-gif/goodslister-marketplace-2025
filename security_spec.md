# Security Specification for Goodslister

## Data Invariants
1. A listing must be owned by the creator.
2. A booking must have a valid listingId and renterId.
3. A user can only edit their own profile.
4. Only participants can read messages in a conversation.
5. Reviews must be linked to a valid booking.

## The Dirty Dozen Payloads

### 1. Identity Spoofing (Listing)
Target: `create /listings/malicious-listing`
Payload: `{ "id": "malicious-listing", "title": "Free Boat", "ownerId": "victim-id", "category": "Boats" }`
Expectation: `PERMISSION_DENIED` (ownerId must match request.auth.uid)

### 2. Privilege Escalation (User)
Target: `update /users/{myId}`
Payload: `{ "role": "SUPER_ADMIN" }`
Expectation: `PERMISSION_DENIED` (Regular users cannot change their role)

### 3. Orphaned Booking
Target: `create /bookings/orphan`
Payload: `{ "listingId": "non-existent", "renterId": "my-id", ... }`
Expectation: `PERMISSION_DENIED` (Listing must exist)

### 4. Shadow Update (Listing)
Target: `update /listings/{myListingId}`
Payload: `{ "rating": 5.0, "reviewsCount": 1000 }`
Expectation: `PERMISSION_DENIED` (These fields are system-managed or restricted)

### 5. Concurrent Write Hijack (Booking)
Target: `update /bookings/{bookingId}`
Payload: `{ "status": "confirmed" }` (by someone who is not the owner or renter)
Expectation: `PERMISSION_DENIED`

### 6. Resource Exhaustion (Message)
Target: `create /conversations/{id}/messages/{msgId}`
Payload: `{ "text": "A" * 1000000 }`
Expectation: `PERMISSION_DENIED` (Text size limit)

### 7. Unauthorized Read (Conversation)
Target: `get /conversations/not-mine`
Expectation: `PERMISSION_DENIED`

### 8. PII Leak (User)
Target: `get /users/someone-else` (requesting private fields if any)
Expectation: `PERMISSION_DENIED`

### 9. Illegal State Transition (Booking)
Target: `update /bookings/{id}`
Payload: `{ "status": "confirmed" }` (when current status is 'cancelled')
Expectation: `PERMISSION_DENIED`

### 10. ID Poisoning
Target: `create /listings/very-long-id-that-is-not-alphanumeric-...`
Expectation: `PERMISSION_DENIED` (isValidId check)

### 11. Spoofed Timestamp
Target: `create /bookings/new`
Payload: `{ "createdAt": "2020-01-01" }`
Expectation: `PERMISSION_DENIED` (Must be request.time)

### 12. Unauthorized Review
Target: `create /reviews/bad`
Payload: `{ "bookingId": "not-my-booking", ... }`
Expectation: `PERMISSION_DENIED`
