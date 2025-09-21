import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function swaggerSetup(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Inctagram')
    .setDescription(
      `
## WebSocket API
**Namespace:** /notifications  
**Authentication:** JWT в cookie (accessToken)  

### События

**connected**  
Описание: подтверждение успешного подключения  
Payload:  
<pre><code>{"message":"Successfully connected to notifications"}</code></pre>

**notification**  
Описание: уведомление об успешной оплате подписки  
Payload:  
<pre><code>{
  "type": "payment_success",
  "data": {
    "planType": "MONTHLY",
    "paymentMethod": "stripe",
    "endDate": "2025-12-31T23:59:59.000Z"
  },
  "message": "Subscription successfully payed"
}</code></pre>

### Пример клиента

<pre><code>
import { io } from "socket.io-client";
const socket = io("/notifications", { withCredentials: true });
socket.on("connected", (data) => {
  console.log("Connected:", data.message);
});
socket.on("notification", (data) => {
  if (data.type === "payment_success") {
    console.log("Payment success:", data);
  }
});
</code></pre>
`,
    )

    .setVersion('1.0')
    .addServer('/api/v1')
    .addApiKey({ type: 'apiKey', name: 'accessToken', in: 'cookie' }, 'accessToken')
    .addApiKey({ type: 'apiKey', name: 'refreshToken', in: 'cookie' }, 'refreshToken')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1', app, document, {});
}
