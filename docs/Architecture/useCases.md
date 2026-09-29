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
- Email is missing → show error "Email is required"
- Password is missing → show error "Password is required"

---

### UC-2: Log In

**Actor:** Rider

**Precondition:** User is not logged in but already has an account

**Main Success Scenario:**
1. User opens the app
2. User navigates to the login page
3. User enters their email and password
4. User clicks log in
5. User gets redirected to the map

**Extensions:**
- Email does not exist → show error "User with this email does not exist"
- Password is incorrect → show error "Incorrect password"

---

### UC-3: Track a Ride

**Actor:** Rider

**Precondition:** User is logged in

**Main Success Scenario:**
1. User opens the app
2. User presses the Start button
3. GPS begins tracking the user's location
4. The App draws the route on the map in real time as the user rides
5. User presses Stop
6. Ride is saved with distance and duration

**Extensions:**
- GPS permission denied → show error asking user to enable location
- Connection drops mid-ride → points stop saving until reconnected

---

### UC-4: View Ride History

**Actor:** Rider

**Precondition:** User is logged in and has at least one completed ride

**Main Success Scenario:**
1. User opens the app
2. User opens the ride history panel
3. User sees a list of past rides with date, distance, and duration
4. User clicks a ride
5. The route renders on the map

**Extensions:**
- No rides yet → show "No completed rides yet" message

---

### UC-5: View Coverage Map

**Actor:** Rider

**Precondition:** User is logged in and has at least one completed ride

**Main Success Scenario:**
1. User opens the app
2. Coverage layer automatically loads on the map
3. All roads ever ridden are highlighted
4. User can see which areas of the city are unexplored

**Extensions:**
- No rides yet → coverage layer is empty

---

### UC-6: Plan Fastest Route

**Actor:** Rider

**Precondition:** User is logged in

**Main Success Scenario:**
1. User enters a destination on the map
2. User clicks "Fastest Route"
3. Dijkstra's algorithm computes the shortest path
4. Route renders on the map in blue
5. User sees distance and estimated time

**Extensions:**
- Destination not found → show error "Destination not found"
- No path exists between start and destination → show error

---

### UC-7: Plan Undiscovered Route

**Actor:** Rider

**Precondition:** User is logged in

**Main Success Scenario:**
1. User enters a destination on the map
2. User clicks "Undiscovered Route"
3. A* algorithm computes a path prioritizing unridden roads
4. Route renders on the map in orange alongside the fastest route
5. User sees the percentage of the route that is undiscovered

**Extensions:**
- All roads to destination have already been ridden → returns least-ridden path
- No path exists between start and destination → show error

