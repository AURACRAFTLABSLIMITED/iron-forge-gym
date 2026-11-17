# Security Specification & Payload-First TDD
Created by AURA CRAFT LABS LIMITED.

## 1. Data Invariants
1. **Role Integrity**: No authenticated user can self-assign `admin` role or create `/admins/{uid}` documents. Admin status is derived strictly from `/admins/{uid}` existence or the verified bootstrap email (`email_verified == true`).
2. **Membership Tamper Resistance**: Members cannot elevate `membershipStatus` to `active` or extend `planExpiryDate` during `users/{userId}` create or update. Only admins may modify membership plan fields.
3. **PII Isolation**: Member profiles (`/users/{userId}`), orders (`/orders/{orderId}`), bookings (`/bookings/{bookingId}`), attendance (`/attendance/{recordId}`), contact messages (`/messages/{messageId}`), and newsletter emails (`/newsletter/{subscriberId}`) are strictly restricted so non-owners/non-admins cannot read or list other users' PII.
4. **Booking Referential Integrity**: Creating a booking in `/bookings/{bookingId}` requires `userId == request.auth.uid`, `status == 'confirmed'`, and `exists(/databases/$(database)/documents/classes/$(classId))`.
5. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps must match `request.time`, and `createdAt` is immutable after creation.
6. **Public Create-Only Forms**: `/messages` and `/newsletter` allow unauthenticated `create` with strict field/size allowlists (`read == false` on messages), while denying public reads, updates, or deletes.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Shadow Admin Creation**: Authenticated member writes `/admins/{uid}` `{ uid: auth.uid, createdAt: serverTimestamp() }`.
2. **Self-Activated Membership**: New user creates `/users/{uid}` with `membershipStatus: "active"` and `planName: "Annual Performance Club"`.
3. **Ghost Field Injection**: Member updates `/users/{uid}` adding `{ isAdmin: true }` alongside `displayName`.
4. **Plan Expiry Tampering**: Member updates `/users/{uid}` changing `planExpiryDate: "2099-12-31"`.
5. **PII Cross-Read**: Member A calls `getDoc(doc(db, 'users', memberB_uid))` or `list` on `users`.
6. **Orphan Class Booking**: Member creates booking with `classId: "non-existent-class-id"`.
7. **Booking Identity Spoofing**: Member A creates booking with `userId: memberB_uid`.
8. **Order Status Manipulation**: Member creates order with `status: "completed"` or updates own order `status` to `"completed"`.
9. **Public Message Scraping**: Unauthenticated or non-admin user calls `getDocs(collection(db, 'messages'))`.
10. **Forged Message Read Flag**: Unauthenticated user submits contact message with `read: true`.
11. **Non-Admin Package Tampering**: Regular member updates `/packages/{id}` setting `price: 0`.
12. **Resource Exhaustion / ID Poisoning**: Attacker writes a 2KB document ID or 50KB `name` string exceeding `.size()` guards.
