# Security Specification for Educational Technology Equipment Borrowing System

## 1. Data Invariants
1. **User Identity & Role Invariant**: A user document must match the authenticated `request.auth.uid`. A regular user cannot escalate their role or modify another user's profile.
2. **Bootstrapped Admin Invariant**: The designated system owner (`fluke12345638@gmail.com`) and any verified email in `/admin_members/{memberId}` have administrative authority.
3. **Equipment Integrity Invariant**: Only administrators may create, modify, or delete equipment documents. Quantities must be positive integers, and `availableQuantity <= totalQuantity`.
4. **Borrow Request Invariant**: Borrow requests can only be created by signed-in users with their own `userId == request.auth.uid`. Status initially must be `'pending'`.
5. **State Transition Invariant**: Only administrators can approve, reject, or mark equipment as returned. Normal users cannot approve their own requests.
6. **Quantity Protection Invariant**: When borrowing, requested quantity must be `>= 1`.

## 2. The "Dirty Dozen" Malicious Payloads

1. **Payload 1 (Ghost Field / Shadow Update on User Profile)**
   - Attempt: Normal user injects `role: "admin"` and `isAdmin: true` into their own user profile.
   - Target: `PATCH /users/{uid}`
   - Result Expected: `PERMISSION_DENIED`

2. **Payload 2 (Impersonation Write on User Document)**
   - Attempt: User with UID `victim-123` tries to write to `/users/attacker-999` with forged UID.
   - Target: `SET /users/victim-123` with payload `{ uid: "attacker-999" }`
   - Result Expected: `PERMISSION_DENIED`

3. **Payload 3 (Unauthenticated Read of User PII)**
   - Attempt: Unauthenticated user requests `/users/{userId}`.
   - Result Expected: `PERMISSION_DENIED`

4. **Payload 4 (Non-Admin Equipment Creation)**
   - Attempt: Regular student attempts to create a new camera record in `/equipments`.
   - Result Expected: `PERMISSION_DENIED`

5. **Payload 5 (Non-Admin Equipment Update / Deletion)**
   - Attempt: Regular student attempts to delete or modify `/equipments/{equipmentId}`.
   - Result Expected: `PERMISSION_DENIED`

6. **Payload 6 (Self-Approval of Borrow Request)**
   - Attempt: Student submits a borrow request with initial status `'approved'` directly.
   - Target: `CREATE /borrow_requests/{requestId}` with `{ status: "approved" }`
   - Result Expected: `PERMISSION_DENIED`

7. **Payload 7 (Borrow Request for Another User)**
   - Attempt: User A creates a borrow request with `userId: "user-B-id"`.
   - Target: `CREATE /borrow_requests/{requestId}` with `userId != auth.uid`
   - Result Expected: `PERMISSION_DENIED`

8. **Payload 8 (Student Overwriting Approved Request to Returned)**
   - Attempt: Student attempts to update status from `'approved'` to `'returned'` without admin inspection.
   - Target: `UPDATE /borrow_requests/{requestId}`
   - Result Expected: `PERMISSION_DENIED`

9. **Payload 9 (Massive Payload / Denial of Wallet Attack)**
   - Attempt: Submitting a 500KB string in `purpose` or `description`.
   - Target: `CREATE /borrow_requests/{requestId}` with `purpose.size() > 1000`
   - Result Expected: `PERMISSION_DENIED`

10. **Payload 10 (Non-Admin Adding Admin Member)**
    - Attempt: Regular user attempts to add their email into `/admin_members/{memberId}`.
    - Target: `SET /admin_members/{memberId}`
    - Result Expected: `PERMISSION_DENIED`

11. **Payload 11 (Invalid ID Injection / Path Variable Poisoning)**
    - Attempt: Writing to an equipment ID containing malicious script/control characters `CAM/../../etc`.
    - Target: Non-alphanumeric or excessively long path variable.
    - Result Expected: `PERMISSION_DENIED`

12. **Payload 12 (Negative or Zero Quantity Borrowing)**
    - Attempt: Submitting borrow request with `quantity: -5` or `quantity: 0`.
    - Target: `CREATE /borrow_requests/{requestId}`
    - Result Expected: `PERMISSION_DENIED`

## 3. Test Runner Specification
Tests implemented in `firestore.rules.test.ts` to assert that all 12 dirty payloads are blocked with `PERMISSION_DENIED`.
