# AAI_Hardware Resources


**AAI_Hardware Resources** is a full-stack web application for managing IT hardware resources, requests, and issues within an organization. It provides separate interfaces and workflows for administrators and regular users, supporting authentication, inventory management, request/issue tracking, and reporting.

---

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [User Roles & Workflows](#user-roles--workflows)
- [API Endpoints](#api-endpoints)
- [Frontend Pages](#frontend-pages)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [License](#license)

---


## Features
- Secure authentication for users and admins
- Hardware inventory management (add, update, track stock)
- Hardware request and issue submission (by users)
- Admin approval and management of requests/issues
- Vendor and purchase management
- PDF export of inventory and requests
- User/admin dashboards with statistics
- Profile and settings management (password, theme, etc.)
- Responsive, modern UI (Tailwind CSS)

---


## Architecture
- **Backend:** Node.js, Express, MongoDB (Mongoose ODM)
- **Frontend:** HTML, Tailwind CSS, Vanilla JS
- **PDF Generation:** PDFKit


## Project Structure

**AAI_Hardware Resources** is a full-stack web application for managing IT hardware resources, requests, and issues within an organization. It provides separate interfaces and workflows for administrators and regular users, supporting authentication, inventory management, request/issue tracking, and reporting.
```
login_system/
 **model/**: Mongoose schemas for users, hardware, issues, requests, vendors, purchases, allocation.
 **public/**: Frontend HTML, JS, and CSS files for all admin/user interfaces. Includes:
  - **css/**: Tailwind output and custom styles
  - **js/**: All frontend JS modules (admin/user dashboards, login, requests, etc.)
  - HTML pages for admin, user, and superadmin
 **routes/**: Express route modules for authentication, dashboard, inventory, issues, requests, profile, settings, tickets, user main, user issue, user request, etc.
 **server.js**: Main Express server setup, MongoDB connection, and route mounting.
 **migratepass.js**: Script to migrate/rehash all user passwords (for upgrades).
 **resetpassword.js**: Script to reset a user's password (manual admin tool).
 **tailwind.config.js**: Tailwind CSS configuration.
 **package.json**: Project dependencies and scripts.
 **package-lock.json**: Dependency lock file.
 **.env**: Environment variables (not committed).
 **src/**: Tailwind input CSS.
├── routes/        # Express route handlers (RESTful APIs)
├── server.js      # Main Express server (entry point)
 Secure authentication for users, admins, and superadmins
 Hardware inventory management (add, update, track stock)
 Hardware request and issue submission (by users)
 Admin approval and management of requests/issues
 Vendor and purchase management
 PDF/CSV/Excel export of inventory and requests
 User/admin dashboards with statistics and charts
 Profile and settings management (password, theme, etc.)
 Responsive, modern UI (Tailwind CSS)
 Superadmin user management (promote/demote/delete users)
 Password migration/reset scripts for admin use


 Node.js (v14 or higher recommended)
 MongoDB (local or cloud instance)
### Admin
- Login via `/AdminLogin.html`
 1. Clone the repository:
    ```sh
    git clone <repo-url>
    cd AAI_Hardware
    ```
 2. Install dependencies:
    ```sh
    npm install
    ```
    This will install all required dependencies and devDependencies as listed in `package.json`:
    - express, mongoose, body-parser, cors, dotenv, helmet, express-session, express-mongo-sanitize, bcrypt, chart.js, pdfkit
    - dev: nodemon, tailwindcss, autoprefixer, postcss, concurrently, @tailwindcss/forms, @tailwindcss/container-queries
    
    > **Note:** `pdfkit` is used for PDF export features. Keep it installed if you use PDF export.
 3. Ensure MongoDB is running and update the connection string in `.env` (MONGO_URI) if needed.
| `/api/superadminlogin`                | POST   | Superadmin login                             |
| `/api/reset-password`                 | POST   | Reset password (by username or emp_id)       |
 Start the server and Tailwind in dev mode:
 ```sh
 npm run dev
 ```
 Or, to run only the server:
 ```sh
 npm run server
 ```
 Or, to run only Tailwind CSS watcher:
 ```sh
 npm run tailwind
 ```
 The app will be available at `http://localhost:5000` (default) or the port specified in your `.env` config.
| `/api/inventory/filter-options`        | GET    | Get inventory filter options                 |
| `/api/tickets`                        | GET    | List all hardware requests (tickets)         |
| `/api/tickets/user/:emp_id`           | GET    | Get requests for a specific user             |
| `/api/tickets/:id/status`             | PUT    | Update ticket status                         |
| `/api/issues`                         | GET    | List all maintenance/issue requests          |
| `/api/issues/filter-options`           | GET    | Get issue filter options                     |
| `/api/issues/:id/priority`            | PUT    | Update issue priority                        |
| `/api/issues/:id/technician-status`   | PUT    | Update technician status for issue           |
| `/api/issue-requests`                 | GET    | List all user issue requests (admin)         |
| `/api/issue-requests/user/:emp_id`    | GET    | List issue requests for a user               |
| `/api/issue-requests/:id`             | GET    | Get single issue request                     |
| `/api/issue-requests`                 | POST   | Create new issue request                     |
| `/api/issue-requests/:id`             | PUT    | Update issue request (admin)                 |
| `/api/issue-requests/:id`             | DELETE | Delete issue request                         |
| `/api/dashboard/stats`                | GET    | Dashboard statistics (requests, charts)      |
| `/api/allocations/employee/:emp_id`   | GET    | Get hardware allocations for employee        |
| `/api/hardware/asset/:assetId`        | GET    | Get hardware details by asset ID             |
| ...                                   | ...    | ...                                          |

See `routes/` for full API details and more endpoints (settings, profile, exports, etc.).

---

## Frontend Pages

**Admin:**
- `AdminLogin.html` — Admin login
- `Ad-dash.html` — Admin dashboard
- `Ad-inventory.html` — Inventory management
- `Ad-ticket.html` — Request management
- `Ad-issue.html` — Maintenance/issue management
- `Ad-profile_dashboard.html` — Admin profile
- `Ad-settings.html` — Admin settings
- `Ad-export.html` — Export data
- `Ad_n_request.html` — Create new hardware request

**User:**
- `UserLogin.html` — User login
- `user_dash.html` — User dashboard
- `user_request.html` — Raise hardware request
- `raise_main.html` — Raise maintenance request
- `user_issue.html` — Track issue requests
- `MyRequest.html` — My requests
- `profile_dashboard.html` — User profile
- `Settings.html` — User settings

---

## Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- MongoDB (local or cloud instance)


### Database Setup

Create a MongoDB database named `it_resource_management` with the following collections:

| Collection         | Description                                                        |
|--------------------|--------------------------------------------------------------------|
| allocations        | Tracks hardware allocations to users/employees                     |
| hardware           | Stores hardware asset details (asset_id, model, name, etc.)        |
| hardware_issues    | Catalogs hardware issue types and priorities                       |
| hardware_requests  | Records hardware requests (request_id, asset_id, emp_id, status)   |
| issuerequests      | Tracks maintenance/issue requests from users                       |
| purchases          | Stores purchase records (arrival_date, asset_name, quantity, etc.) |
| users              | User accounts (emp_id, username, password, role, dept, etc.)       |
| vendors            | Vendor/supplier details (gst_number, seller_id, seller_name, etc.) |

---


### Installation
1. Clone the repository:
   ```sh
   git clone <repo-url>
   cd login_system
   ```
2. Install dependencies:
   ```sh
   npm install  nodemon express mongoose body-parser cors dotenv bcrypt pdfkit concurrently
   npm install --save-dev nodemon tailwindcss autoprefixer postcss
   ```
   This will install all required dependencies and devDependencies:
   - express
   - mongoose
   - body-parser
   - cors
   - nodemon (dev)
   - tailwindcss (dev)
   - autoprefixer (dev)
   - postcss (dev)

   > **Note:** `pdfkit` is listed in package.json but is not directly required in the backend code. If you use PDF export features, keep it installed. Remove it from dependencies if not needed.
3. Ensure MongoDB is running and update the connection string in `server.js` if needed.


### Running the Application
Start the server:
```sh
npm run dev
```
The app will be available at `http://localhost:5000` (default) or the port specified in your config.

---

## Example API Usage

### User Login
```http
POST /api/user-login
Content-Type: application/json

{
   "username": "user1",
   "password": "user@123"
}
```

### Admin Login
```http
POST /api/login
Content-Type: application/json

{
   "username": "admin",
   "password": "admin@123"
}
```

### Get Inventory
```http
GET /api/inventory?page=1&limit=10
```

### Export Data (PDF)
```http
GET /api/export
```

---

---


## Folder Details
- **model/**: Mongoose schemas for users, hardware, issues, requests, vendors, and purchases.
- **public/**: Frontend HTML, JS, and CSS files for all admin/user interfaces.
- **routes/**: Express route modules for authentication, dashboard, inventory, issues, requests, profile, settings, etc.
- **server.js**: Main Express server setup, MongoDB connection, and route mounting.
- **package.json**: Project dependencies and scripts.

---


## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change. Contributions for new features, bug fixes, and documentation improvements are appreciated.

---


## License
This project is licensed under the MIT License.


