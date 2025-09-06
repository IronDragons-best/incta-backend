#!/bin/sh

# Start notification service in background
pnpm run start:notification-service &

# Start payment service in background
pnpm run build:payments-service &

# Start files service in background
pnpm run start:files-service &


# Give services time to start
sleep 10

# Start main app (this will run migrations first)
pnpm run start:gd-main-app