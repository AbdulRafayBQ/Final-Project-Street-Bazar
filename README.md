# SB — AI-Powered Multi-Vendor Commerce Platform

SB is a modern AI-powered multi-vendor e-commerce platform that allows users to create and manage their own online stores, sell products, manage inventory, offer wholesale pricing, and provide customized shopping experiences.

The platform is designed for home-based businesses, physical stores, online brands, and individual sellers.

## 🚀 Key Features

### 👤 Customer Features

- User registration and login
- Google OAuth authentication
- Browse multiple stores
- Browse products by categories
- Search and filter products
- Product details and reviews
- Shopping cart
- Order placement
- Order history
- Order tracking using Order ID
- Follow stores
- Personalized "From Stores You Follow" section
- Product reviews and ratings
- Product customization
- AI-powered shopping assistant

### 🏪 Store Owner Features

Store owners can create and manage their own online store.

- Create a store
- Store approval system
- Custom store themes
- Store logo and banner
- Store information and branding
- Product management
- Product image uploads
- Product categories
- Product stock management
- Digital warehouse
- Inventory tracking
- Automatic stock updates after orders
- Low-stock and out-of-stock tracking
- Order management
- Customer management
- Review management
- Store followers
- Wholesale pricing
- Product customization
- Store analytics

### 🤖 AI Features

The platform includes AI-powered tools for both customers and store owners.

#### AI Product Assistant

Store owners can use AI to:

- Generate product titles
- Generate product descriptions
- Generate short descriptions
- Suggest product categories
- Generate product tags

#### AI Shopping Assistant

Customers can search for products using natural language.

For example:

> "Show me shirts under Rs. 1500."

The AI searches the available products and recommends relevant products from the platform.

#### AI Warehouse Assistant

Store owners can use natural language commands to manage and understand their inventory.

Examples:

> "Add 20 black watches to inventory."

> "Which products are low in stock?"

> "How many blue shirts are available?"

#### AI Product Customization

Customers can use AI to create or describe designs for customizable products such as:

- T-shirts
- Mobile covers
- Mugs
- Gifts
- Other customizable products

### 🎨 Store Customization

Every approved store can have its own look and feel.

Store owners can customize:

- Store theme
- Logo
- Banner
- Colors
- Layout
- Featured products
- Categories

This allows different businesses to create their own branded storefront.

### 📦 Digital Warehouse & Inventory

The platform includes a digital warehouse system that helps store owners manage their inventory without relying on spreadsheets.

Store owners can:

- Add stock
- Track available stock
- Track sold quantity
- Monitor low-stock products
- View out-of-stock products
- View inventory activity

When a customer places an order, the product stock is automatically updated.

### 💰 Wholesale Pricing

Store owners can create quantity-based wholesale prices.

Example:

- 1–4 items → Rs. 200 each
- 5–9 items → Rs. 175 each
- 10+ items → Rs. 150 each

The correct price is automatically applied according to the quantity purchased.

### 🎨 Product Customization

Store owners can enable customization for individual products.

Customers can then:

- Add custom text
- Upload designs
- Select options
- Customize products manually
- Customize products with AI

Customization details are saved with the order.

### ❤️ Follow Store System

Customers can follow their favorite stores.

After following a store:

- The store appears in the customer's followed stores
- New products can appear in the personalized feed
- Customers can manage their followed stores
- Store owners can see follower statistics

The customer homepage includes a dedicated:

**"From Stores You Follow"**

section.

### 📍 Order Tracking

Every order receives a unique Order ID.

Customers can use the:

**Track Your Order**

feature to view their order status.

Order stages can include:

- Order Placed
- Confirmed
- Processing
- Ready to Ship
- Shipped
- Out for Delivery
- Delivered
- Cancelled

### ⭐ Reviews & Ratings

Customers can leave reviews and ratings for products.

Store owners can view customer reviews, while administrators can moderate inappropriate content.

### 👨‍💼 Admin Panel

The platform includes a complete administration system.

Administrators can monitor:

- Users
- Store owners
- Store applications
- Stores
- Products
- Orders
- Reviews
- Categories
- Platform activity
- Statistics

### 🏬 Store Approval

New stores are submitted for admin approval.

Store status:

- Pending
- Approved
- Rejected
- Suspended

A store becomes publicly available only after approval.

### 📜 Terms & Policies

The platform includes:

- Terms & Conditions
- Privacy Policy
- Seller Terms
- Customer Terms
- Return & Refund Policy
- Prohibited Products Policy

Users must accept the required terms during registration and store creation.

---

# 🛠 Technology Stack

## Frontend

- HTML5
- CSS3 with responsive layouts and custom themes
- Modern JavaScript ES Modules
- Hash-based client-side routing
- No React
- No TypeScript
- No Vite runtime dependency

## Backend & Services

- Vercel Serverless Functions
- Supabase Authentication
- Supabase PostgreSQL
- Supabase REST API
- Google OAuth
- Supabase Storage
- Configurable AI providers
- Configurable image-generation providers

## Security

- Role-based access control
- Supabase Row Level Security (RLS)
- Protected routes
- Secure authentication
- Server-side AI API integration
- Environment variables for sensitive credentials
- Input validation
- Controlled database access

---

# 👥 User Roles

The platform has three main roles:

### Customer

Can browse stores, purchase products, follow stores, track orders, write reviews, and use AI shopping and customization features.

### Store Owner

Can create and manage a store, add products, manage inventory, process orders, configure wholesale pricing, customize products, and use AI tools.

### Admin

Can manage and monitor the complete platform, approve stores, manage users and products, moderate reviews, and monitor platform activity.

---

## Team & Contributions

This project was developed as a two-member team.

### Abdul Rafay — Lead Developer
- Designed and developed the core application
- Implemented the frontend and responsive UI
- Developed authentication and role-based access
- Implemented store management and seller dashboard
- Developed product, inventory, warehouse and order management
- Implemented AI-powered features
- Developed product customization and wholesale pricing
- Implemented customer features including cart, reviews, following stores and order tracking
- Integrated Supabase backend and database functionality
- Worked on admin panel, security and overall system integration
- Testing, debugging and deployment

### Ahtisham — Project Support & Development
- Assisted with project planning and feature discussions
- Assisted with UI/content ideas and project structure
- Helped with testing and identifying bugs
- Assisted with documentation and presentation preparation
- Provided support during project development and final testing

# 📁 Project Architecture

The project uses a vanilla JavaScript frontend with serverless backend functions.

```text
/
├── frontend/
│   ├── pages/
│   ├── components/
│   ├── js/
│   ├── css/
│   └── assets/
│
├── api/
│   ├── auth/
│   ├── stores/
│   ├── products/
│   ├── orders/
│   ├── inventory/
│   └── ai/
│
├── supabase/
│   └── database/
│
└── README.md

## Project Information

**Project:** Street Bazar
**Founder:** Abdul Rafay
**Student ID:** 352173
**Tester, Designing:** Ahtisham
**Repository:** [Final-Project-Street-Bazar](https://github.com/AbdulRafayBQ/Final-Project-Street-Bazar)

## License

This project was created as an academic and portfolio project by Abdul Rafay.
