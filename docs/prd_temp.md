# Route Explorer

Motorcycle riders who want to explore their city have no good way to track which roads they've already ridden. Apps like Calimoto focus on finding scenic or curvy routes, but none of them answer the question a curious rider actually has: where haven't I been yet?

RouteExplorer is a Progressive Web App that lets riders track every route they ride and visualize their cumulative coverage on a map, showing exactly which roads they've explored and which ones they haven't. Individual past rides are visible as distinct routes, and all rides combined form a coverage layer that grows over time as the rider explores more of their city.

The app also helps riders plan their next ride — offering both the fastest route to a destination and an alternative that deliberately avoids roads they've already ridden, using a custom pathfinding algorithm built on real OpenStreetMap road data.

No app install needed. Just open it on your phone, press Start, and ride.

# Core Features

- Real-time GPS route tracking while riding
- Map view showing all past rides as a coverage layer
- Ride history with stats (distance, duration)
- Route planning: fastest route to a destination
- Route planning: undiscovered route that prioritizes roads never ridden before
- User authentication so data is saved per rider

# User Stories

Authentication

1. As a rider, I want to create an account so that my ride data is saved and private to me
2. As a rider, I want to log in and stay logged in so that I don't have to authenticate every time I open the app

Ride tracking

3. As a rider, I want to start and stop a ride using a button so that my route is tracked in real time and automatically saved when I'm done

Ride history

4. As a rider, I want to see a list of all my past rides with distance and duration so I can review my riding history
5. As a rider, I want to click on a past ride and see its route on the map so I can remember where I went

Coverage

6. As a rider, I want to see all the roads I've ever ridden merged into a single coverage layer on the map so I can see at a glance where I've been and where I haven't
7. As a rider, I want to see what percentage of my city's roads I've explored so I have a goal to work towards

Route planning

8. As a rider, I want to enter a destination and get the fastest route there so I can navigate efficiently when I need to
9. As a rider, I want to get an alternative route that prioritizes roads I've never ridden so I can discover new parts of my city on the way to my destination