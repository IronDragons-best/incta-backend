# WebSocket Documentation

## Connection
- URL: `ws://localhost:3000/notifications`
- Authentication: `accessToken` cookie required

## Events

### Client → Server
No events sent from client (receive only)

### Server → Client

#### `connected`
Sent when client successfully connects.
```json
{
  "message": "Successfully connected to notifications"
}