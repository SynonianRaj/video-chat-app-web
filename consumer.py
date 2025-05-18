# django + daphne server code

from channels.generic.websocket import AsyncJsonWebsocketConsumer

class VideoChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.group_name = f"video_{self.room_name}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        print(f"[connect] {self.channel_name} joined {self.group_name}")

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        print(f"[disconnect] {self.channel_name} left {self.group_name}")

    async def receive_json(self, content, **kwargs):
        # Stamp message with sender's channel name
        content["sender_channel_name"] = self.channel_name
        print("Content received:", content)

        # Broadcast to everyone in the group
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "signal.message",
                "payload": content
            }
        )

    async def signal_message(self, event):
        payload = event["payload"]
        # Filter out messages from ourselves
        if payload.get("sender_channel_name") == self.channel_name:
            return

        # Forward the payload to the WebSocket client
        await self.send_json(payload)