## Use Cases

### UC-1: Register

**Actor:** Rider

**Precondition:** User is not logged in and does not have an account

**Main Success Scenario:**
1. User opens the app
2. User navigates to the register page
3. User enters their email and password
4. User clicks register
5. User gets redirected to the map

**Extensions:**
- Email already exists → show error "User already exists"
- Email format is invalid → show error "Invalid email format"
- Email is missing → show error "Email is missing"
- Password is missing → show error "Password is missing"

---

### UC-2: Login

**Actor:** Rider

**Precondition:** User is not logged in but already has an account

**Main Success Scenario:**
1. User opens the app
2. User navigates to the login page
3. User enters their email and password
4. User clicks login
5. User gets redirected to the map

**Extensions:**
- Email does not exist → show error "Email does not exist"
- Password is incorrect → show error "Password is incorrect"
- Token expires → app silently refreshes using refresh token