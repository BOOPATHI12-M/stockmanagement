# Sudharshini Stock Management System

A complete full-stack stock management system with customer ordering, admin dashboard, order tracking, email notifications, and WhatsApp bot integration.

## Tech Stack

- **Frontend**: React.js + React Router + TailwindCSS
- **Backend**: Spring Boot (Java 17)
- **Database**: SQLite + JPA/Hibernate
- **Authentication**: 
  - Customer: Google OAuth2
  - Admin: Username/Password with JWT
- **Notifications**: 
  - Email (JavaMailSender)
  - WhatsApp Business Cloud API

## Features

### Customer Side
- Google OAuth login
- Browse products with images, prices, and stock status
- Shopping cart with add/remove/update quantity
- Checkout with delivery information
- Order history
- Amazon-style order tracking with timeline

### Admin Side
- Admin login with JWT
- Product management (CRUD)
- Stock management (IN/OUT movements)
- Supplier management
- Order management with status updates
- Dashboard with summary statistics
- Low stock and expiry alerts

### Notifications
- **Email**: Order confirmations, low stock alerts
- **WhatsApp**: 
  - Automatic order updates
  - Low stock alerts
  - Expiry alerts
  - Chatbot commands (order tracking, stock queries, etc.)

## Setup Instructions

### Prerequisites
- Java 17 or higher
- Node.js 18 or higher
- Maven 3.6+
- Google OAuth2 credentials
- WhatsApp Business Cloud API credentials
- SMTP email configuration

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Update `src/main/resources/application.properties` with your configurations:
   - Email SMTP settings
   - Google OAuth client ID and secret
   - WhatsApp Business Cloud API credentials
   - JWT secret key

3. Build and run:
```bash
mvn clean install
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update `src/App.jsx` with your Google OAuth Client ID:
```javascript
const GOOGLE_CLIENT_ID = 'your-google-client-id'
```

4. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

### Database

SQLite database (`stock_management.db`) will be created automatically on first run. The schema is managed by Hibernate with `spring.jpa.hibernate.ddl-auto=update`.

### Initial Admin User

A default admin user is automatically created on first startup:
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@sudharshini.com`

**⚠️ IMPORTANT**: Change the default admin password immediately after first login for security!

To create additional admin users, you can:
1. Use the admin interface (if you add user management features)
2. Manually insert into the database with BCrypt hashed password
3. Modify `DataInitializer.java` to add more users

### Sample Data

You can add sample products, suppliers, and other data through the admin interface after logging in.

## API Endpoints

### Authentication
- `POST /api/auth/customer/google` - Customer Google login
- `POST /api/auth/admin/login` - Admin login

### Products
- `GET /api/products` - Get all products
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/{id}` - Update product (Admin)
- `DELETE /api/products/{id}` - Delete product (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/{id}` - Get order by ID
- `GET /api/orders/customer/{customerId}` - Get customer orders
- `GET /api/orders/all` - Get all orders (Admin)
- `PATCH /api/orders/{id}/status` - Update order status (Admin)
- `GET /api/orders/{id}/tracking` - Get tracking information

### Stock
- `POST /api/stock/in` - Add stock IN
- `POST /api/stock/out` - Add stock OUT
- `GET /api/stock/history/{productId}` - Get stock history

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create supplier (Admin)
- `PUT /api/suppliers/{id}` - Update supplier (Admin)
- `DELETE /api/suppliers/{id}` - Delete supplier (Admin)

### Reports
- `GET /api/reports/summary` - Get dashboard summary (Admin)

### WhatsApp
- `GET /api/whatsapp/webhook` - Webhook verification
- `POST /api/whatsapp/webhook` - Receive WhatsApp messages
- `POST /api/whatsapp/send` - Send WhatsApp message

## WhatsApp Bot Commands

### Customer Commands
- `order <order_id>` - View order details
- `track <order_id>` - Track your order
- `my orders` - List all your orders
- `help` - Show available commands

### Admin Commands
- `stock <product_name>` - Check stock by name
- `stock <product_id>` - Check stock by ID
- `low stock` - List low stock items
- `add stock <name> <qty>` - Add stock
- `expiry list` - List near expiry products
- `help admin` - Show admin commands

## Configuration

### Email Configuration
Update `application.properties`:
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
admin.email=admin@sudharshini.com
```

### WhatsApp Configuration
Update `application.properties`:
```properties
whatsapp.api.url=https://graph.facebook.com/v18.0
whatsapp.phone.number.id=your-phone-number-id
whatsapp.access.token=your-whatsapp-access-token
whatsapp.verify.token=your-verify-token
```

### Google OAuth Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Update `application.properties` and `App.jsx` with client ID and secret

## Project Structure

```
project/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/sudharshini/stockmanagement/
│   │   │   │   ├── config/          # Security, CORS config
│   │   │   │   ├── controller/      # REST controllers
│   │   │   │   ├── dto/             # Data transfer objects
│   │   │   │   ├── entity/          # JPA entities
│   │   │   │   ├── repository/      # JPA repositories
│   │   │   │   ├── service/         # Business logic
│   │   │   │   └── util/            # Utilities (JWT)
│   │   │   └── resources/
│   │   │       └── application.properties
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── admin/                   # Admin pages
│   │   ├── components/              # Reusable components
│   │   ├── context/                 # React contexts
│   │   ├── pages/                   # Customer pages
│   │   ├── services/                # API services
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## Features in Detail

### Order Tracking
- Amazon-style vertical timeline
- Real-time status updates
- Estimated delivery window
- Tracking events: Label Created → Shipped → Out for Delivery → Delivered

### Stock Management
- Automatic low stock detection (< 10 units)
- Stock IN/OUT movements with reasons
- Stock history tracking
- Expiry date management

### Notifications
- **Email**: Sent asynchronously for order confirmations and low stock alerts
- **WhatsApp**: Real-time updates for order status changes and stock alerts

## Troubleshooting

### Backend won't start
- Check Java version: `java -version` (should be 17+)
- Check Maven: `mvn -version`
- Verify database file permissions

### Frontend won't start
- Check Node version: `node -v` (should be 18+)
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

### WhatsApp webhook not working
- Verify webhook URL is accessible
- Check verify token matches configuration
- Ensure WhatsApp Business API is properly set up

### Email not sending
- Verify SMTP credentials
- For Gmail, use App Password instead of regular password
- Check firewall/network settings

## License

This project is for educational purposes.

## Support

For issues or questions, please check the code comments or create an issue in the repository.

