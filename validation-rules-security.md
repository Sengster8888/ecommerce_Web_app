# Authentication Validation Rules & Security Requirements

This document defines the strict **Security Requirements** and **API Validation Rules** for the authentication subsystem of the Cambodian E-Commerce Web Application. These specifications are mapped directly from **Section 13 (Security)** and **Section 14 (Validation)** of the System Requirements Specification, translated into concrete technical implementations for a NestJS & Prisma backend.

---

## 1. Security Requirements (Auth Subsystem)

The table below lists the core security mandates and their corresponding technical enforcement in the NestJS backend:

| Security Area | Requirements & Technical Implementation | SRS Reference |
| :--- | :--- | :--- |
| **Password Hashing** | *   Never store passwords in plaintext or reversible encryption.<br>*   **Implementation:** Use **Bcrypt** with a salt round of `12` or **Argon2id** during user registration and password reset workflows. | Section 13 |
| **Token-Based Auth** | *   Stateless token authentication with dual-token rotation.<br>*   **Access Token:** Short-lived JWT (expires in `15m`) passed in the JSON response body.<br>*   **Refresh Token:** Long-lived JWT (expires in `7d`) containing a unique session ID. | Section 13 |
| **Refresh Token Storage** | *   Protect tokens from Cross-Site Scripting (XSS) attacks.<br>*   **Implementation:** Store the raw refresh token in an **`HttpOnly`**, **`Secure`**, **`SameSite=Strict` Cookie** on the HTTP response. Store a hashed version (`refreshTokenHash`) in the database. | Section 13 |
| **Session Revocation** | *   Logout or password reset must instantly invalidate all active sessions.<br>*   **Implementation:** Set `User.refreshTokenHash` to `null` on logout or password reset to enforce universal device logout. | Section 13 |
| **Role-Based Access Control (RBAC)** | *   Enforce access controls server-side at the route handler level, not just visually in the UI.<br>*   **Implementation:** Create a NestJS `RolesGuard` paired with a `@Roles('customer' \| 'admin')` decorator to shield protected APIs. | Section 13 |
| **Brute-Force Protection** | *   Implement Rate Limiting on authentication and high-abuse endpoints.<br>*   **Implementation:** Use `@nestjs/throttler` to rate-limit `/api/auth/login`, `/api/auth/register`, `/api/auth/otp/send`, and `/api/auth/password/forgot` (e.g., maximum of 5 attempts per minute). | Section 13 |
| **XSS & SQL Injection** | *   Sanitize all inputs at the controller boundary. Protect against SQL Injection via ORM query parameterization.<br>*   **Implementation:** Prisma handles parameterized queries natively. Ensure any custom raw queries (if used) employ SQL placeholders instead of string concatenation. | Section 13 |

---

## 2. Validation Rules

Validation rules must be enforced strictly on the server-side, regardless of any frontend-side client validation. NestJS utilizes `class-validator` and `class-transformer` pipes to enforce these rules.

### A. User Registration (`POST /api/auth/register`)
Enforces formatting and identity uniqueness when a user establishes a new account:

*   **Full Name (`name`):**
    *   *Rule:* Required, must be a string.
    *   *Length:* Between `2` and `150` characters.
*   **Email (`email`):**
    *   *Rule:* Required, must be a valid email format (`IsEmail()`).
    *   *Uniqueness:* Before creation, check if the email exists in PostgreSQL via Prisma. If it exists, throw a `400 Bad Request` ("User with this email already exists.").
*   **Phone Number (`phone`):**
    *   *Rule:* Required (except for Google OAuth accounts, which can complete it later in their profile).
    *   *Format:* Must match **Cambodian phone number formats** (supporting both local prefix `0` and country code `+855`, followed by 7 to 8 digits).
    *   *Regex Validator:* `/^(?:\+855|0)[1-9]\d{7,8}$/`
        *   Matches: `012345678` (9 digits local), `+855961234567` (12 digits international), `010234567` (9 digits).
*   **Password (`password`):**
    *   *Rule:* Required.
    *   *Complexity:* Minimum of `8` characters and a maximum of `100` characters. Must contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g., `@`, `$`, `!`, `&`).
*   **OTP Code (`otpCode`):**
    *   *Rule:* Required for standard registrations.
    *   *Format:* Must be exactly `6` digits (`/^\d{6}$/`).
    *   *Verification:* Matches a valid, unexpired (less than 5 minutes old) entry in the `OtpVerification` table with the purpose `REGISTER_VERIFY`.

### B. User Login (`POST /api/auth/login`)
Designed to authenticate returning customers or administrators securely:

*   **Credentials Validation:**
    *   Both `email` (valid email string) and `password` (string) are strictly required.
*   **Failure Handling (Vulnerability Prevention):**
    *   *Security Rule:* **Generic error messages** on failure. Never reveal whether the email exists in the system or if the password was simply incorrect to prevent email enumeration or brute-force scanning.
    *   *Action:* In both cases of wrong email and wrong password, return:
        `401 Unauthorized` - `{ "message": "Invalid credentials." }`
*   **Account State Validation:**
    *   *Rule:* Before issuing tokens, check if the user's email is verified (`isEmailVerified === true`). If not, reject with `400 Bad Request` - `{ "message": "Email has not been verified yet." }` and prompt OTP completion.

### C. Forgot Password (`POST /api/auth/password/forgot`)
Allows account recovery without exposing database structures to scanners:

*   **Email (`email`):**
    *   *Rule:* Required, valid email string.
*   **Security Rule (Anti-Enumeration):**
    *   If the email entered does **not** exist in the database, the backend must **not** return a `404 Not Found`. Instead, return a successful `200 OK` response with a generic message: *"If the email is registered in our system, an OTP code has been sent to it."* 
    *   This prevents attackers from scanning your API to see which email addresses have active shopping accounts.

### D. Reset Password (`POST /api/auth/password/reset`)
Completes account recovery atomically:

*   **Payload Requirements:**
    *   `email` (valid email), `otpCode` (exactly 6 digits), and `newPassword` (must pass registration-level complexity checks).
*   **Database Constraints:**
    *   OTP verification code must exist in PostgreSQL, match the requested email, carry the purpose `PASSWORD_RESET`, and be unexpired (expires in 5 minutes).
*   **Atomic Reset & Invalidation:**
    *   Must run within a **Prisma Database Transaction** (`$transaction`):
        1.  Verify the OTP code.
        2.  Hash the new password.
        3.  Update the user's password record in the database.
        4.  **Crucial Security Action:** Set the user's `refreshTokenHash` to `null` to log out all active sessions on other devices instantly.
        5.  Delete the consumed OTP code.

---

## 3. NestJS Code Reference (DTOs Implementation)

Below are the class-validator data transfer objects (DTOs) configured to enforce these validation and security requirements at the NestJS API boundary.

### Registration DTO (`register-otp.dto.ts`)
```typescript
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class RegisterOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 150, { message: 'Name must be between 2 and 150 characters.' })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 100, { message: 'Password must be between 8 and 100 characters long.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' }
  )
  password: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:\+855|0)[1-9]\d{7,8}$/, {
    message: 'Phone number must be a valid Cambodian format (+855... or 0...)',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits.' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits.' })
  otpCode: string;
}
```

### Password Reset DTO (`reset-password.dto.ts`)
```typescript
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits.' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits.' })
  otpCode: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 100, { message: 'Password must be between 8 and 100 characters long.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' }
  )
  newPassword: string;
}
```
