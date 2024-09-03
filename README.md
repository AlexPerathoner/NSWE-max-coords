# NSWE Max Coords

> Add points on a globe - get max bound square.

![Screenshot](./screens/example-screen.png)

## How to start

1. Create `frontend/.env` file with `REACT_APP_MAPBOX_TOKEN=<mapbox-token>` inside.
1. `docker compose up`

## How to use

Right click on the globe to add points. The app will calculate the max bound square and display it.

Click on existing points to remove them.

## Security

None. The "login" function allows anyone to enter the app with any username. Just to make it possible to have multiple users on the same instance.
