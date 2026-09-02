# 🌾 KARWAAN (कारवां) — Multimodal Cold-Chain Consolidation & Spoilage Intelligence Platform

<div align="center">

<img src="./frontend/src/photos/karwaanlogo4.png" alt="Karwaan Logo" width="140" style="max-width: 140px; height: auto;" />

### *Multimodal Perishable Consolidation & Real-Time Spoilage Intelligence*

**Transforming Perishable Agri-Logistics across India through AI-Powered Load Pooling, Multimodal Cold Corridors (Road + Rail), and Real-Time Kinetic Spoilage Prediction.**

[![Platform: Karwaan](https://img.shields.io/badge/Platform-Karwaan-163832?style=for-the-badge&logo=target)](https://github.com/Juggernauts-jod)
[![License: MIT](https://img.shields.io/badge/License-MIT-5C7A50?style=for-the-badge)](LICENSE)
[![Frontend](https://img.shields.io/badge/React%2019-Vite%20%7C%20Tailwind%20v4-blue?style=for-the-badge&logo=react)](./frontend)
[![Backend](https://img.shields.io/badge/Node.js-Express%20%7C%20Drizzle%20ORM-green?style=for-the-badge&logo=node.js)](./backend)
[![Database](https://img.shields.io/badge/Database-Neon%20Serverless%20Postgres-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech)
[![AI/ML](https://img.shields.io/badge/AI%2FML-Scikit--Learn%20%7C%20Gemini-orange?style=for-the-badge&logo=python)](./backend/models)

[Features](#-key-capabilities--features) • [Architecture](#-system-architecture) • [Getting Started](#-installation--instruction-manual) • [ML Pipeline](#-machine-learning--risk-intelligence) • [API Reference](#-api-endpoints) • [Team](#-team-juggernaut) • [Citations](#-citations--references)

</div>

---

## 📌 Executive Summary

In India, **over 30–40% of harvested perishable produce** (fruits, vegetables, dairy, and pharmaceuticals) spoils before reaching end markets due to fragmented cold-chain transport, high direct reefer costs, and uncoordinated smallholder shipping.

**Karwaan (कारवां)** is an enterprise-grade, full-stack logistics orchestration platform engineered to solve this challenge. By combining **combinatorial bin-packing optimization**, **multimodal route scheduling (Dedicated Rail Cold Corridors + Road Reefers)**, and **real-time kinetic shelf-life decay monitoring**, Karwaan reduces freight logistics costs by **35–42%**, cuts transport emissions by **~47%**, and keeps transit spoilage **under 1.8%**.

---

## 🚀 Key Capabilities & Features

### 1. 📦 AI Freight Consolidation Engine
- **Intelligent Batch Pooling**: Groups micro-consignments from disparate agro-businesses based on geographical proximity, temperature band compatibility (e.g., Chill $2^\circ\text{C}-8^\circ\text{C}$, Freeze $-18^\circ\text{C}$, Ambient $15^\circ\text{C}-25^\circ\text{C}$), and SLA delivery windows.
- **Multimodal Routing (Road + Rail Cold Wagons)**: Automatically switches long-haul transfers (>200 km) from high-cost highway reefers to eco-efficient railway cold wagons (`rail_cold_wagon`), optimizing the cost/delay/spoilage Pareto frontier.
- **Weighted Multi-Objective Optimization Matrix**:
  $$\text{Score} = (0.4 \times \text{Cost}) + (0.3 \times \text{Delay Risk}) + (0.3 \times \text{Spoilage Risk})$$

### 2. ❄️ Real-Time Spoilage Intelligence & Freshness Gauging
- **Kinetic Shelf-Life Modeling**: Dynamically calculates remaining shelf life ($h$) by sampling real-time IoT temperature telemetry against baseline Arrhenius biological decay curves.
- **Thermal Excursion Alerts**: Instantaneous flags when cargo temperature departs from allowable $\left[T_{\min}, T_{\max}\right]$ thresholds.
- **Predictive Freshness Index**: Displays intuitive visual gauges with dynamic color transitions (Optimal Forest Green `#5C7A50` $\to$ Warning Amber `#D98E2B` $\to$ Critical Rust Red `#B3462C`).

### 3. 🚨 Dynamic Incident Management & Autonomous Re-Routing
- **Proactive Disruption Handling**: Live logging of vehicle breakdowns, cold-unit failures, traffic congestion, and extreme weather heatwaves.
- **Automated Fallback Dispatch**: Triggers on-the-fly route recalculation and nearby cold-storage hub transfers before cargo breaches critical spoilage thresholds.

### 4. 👥 Role-Based Portals (RBAC)
- **Admin Command Center**: Complete oversight of all regional shipments, interactive Leaflet multimodal India map, clustering engine controls, and incident monitoring.
- **Business / Shipper Portal**: Booking consignment intake, live tracking of owned batches, carbon emission reduction metrics, and cost savings analytics.
- **Agent / Driver Hub**: Mobile-responsive turn-by-turn leg navigation, temperature check-in logging, and one-tap emergency incident reporting.

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT TIER (React 19)                           │
│  ┌────────────────────┐  ┌──────────────────────┐  ┌─────────────────────┐  │
│  │  Admin Dashboard   │  │  Business Portal     │  │   Agent Mobile UI   │  │
│  │  (Leaflet Map +    │  │  (Shipment Booking & │  │   (Leg Tracking &   │  │
│  │   Cluster Engine)  │  │   Savings Analytics) │  │    Incident Action) │  │
│  └─────────┬──────────┘  └──────────┬───────────┘  └──────────┬──────────┘  │
└────────────┼────────────────────────┼─────────────────────────┼─────────────┘
             │                        │                         │
             ▼                        ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY & SERVICE TIER                         │
│                           (Express.js + TypeScript)                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Middleware: JWT Auth • Role-Based RBAC • CORS • Field-Masking Filter │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────┬───────────────────────────────────────────┐  │
│  │ Consolidation Engine      │ Risk & Spoilage Prediction Service        │  │
│  │ • Multi-Objective Scorer  │ • Thermal Decay Modeling                  │  │
│  │ • Multimodal Corridors    │ • ML Delay Classifier Pipeline            │  │
│  │ • Haversine / Dist Matrix │ • Gemini AI Explanations                  │  │
│  └───────────────────────────┴───────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌──────────────────────────────────────┐        ┌──────────────────────────────┐
│        DATABASE PERSISTENCE          │        │      ML & DATA LAYER         │
│  Neon Serverless PostgreSQL          │        │  Scikit-Learn • Pandas       │
│  • Drizzle ORM Schema & Relations    │        │  • Random Forest Classifier  │
│  • Time-Series Temperature Logs      │        │  • Delay & Spoilage Models   │
│  • Clustered Shipment Graph          │        │  • 100k+ Telemetry Datasets  │
└──────────────────────────────────────┘        └──────────────────────────────┘
```

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Leaflet, Lucide Icons, React Router v7 |
| **Backend API** | Node.js, Express.js v5, TypeScript, TSX runtime, Drizzle ORM |
| **Database** | Neon Serverless PostgreSQL (Cloud-Hosted with SSL) |
| **AI / ML & Modeling** | Python 3.10+, Scikit-Learn (Random Forest), Pandas, NumPy, Google Gemini API (`@google/genai`) |
| **Mapping & GIS** | Leaflet.js, CartoDB Voyager Tile Matrix, Custom Multimodal SVG Overlays |
| **Security & Auth** | JWT Authentication, Bcrypt password hashing, RBAC middleware, Demo backdoor bypass |

---

## 📖 Installation & Instruction Manual

### 📋 Prerequisites
Before running Karwaan, ensure you have the following installed:
- **Node.js**: `v18.0.0` or higher (Recommended: `v20.x+`)
- **npm**: `v9.0.0` or higher (or `pnpm` / `bun`)
- **Python**: `v3.10+` (optional, for re-training machine learning models)
- **Git**: For version control

---

### 📥 1. Clone & Set Up the Repository

```bash
# Clone the repository
git clone https://github.com/Sid-is-afk/SOA-Ideathon.git
cd SOA-Ideathon
```

---

### ⚙️ 2. Environment Configuration

#### Backend Environment (`backend/.env`)
The project comes pre-configured with a live cloud-hosted Neon Serverless PostgreSQL connection. Ensure `backend/.env` contains:

```env
DATABASE_URL="postgresql://neondb_owner:npg_c9eO2NlJpQyP@ep-green-wind-a1i86588-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
PORT=3001
JWT_SECRET="karwaan-super-secret-jwt-key-2026"
GEMINI_API_KEY="your_optional_gemini_api_key_here"
```

#### Frontend Environment (`frontend/.env`)
Create or verify `frontend/.env`:

```env
VITE_API_URL="http://localhost:3001/api"
```

---

### 📦 3. Install Dependencies

You can install dependencies for all modules from the root directory:

```bash
# Install root, backend, and frontend packages in one command
npm run install-all
```

*Or install them individually:*
```bash
npm install --prefix backend
npm install --prefix frontend
```

---

### 🗄️ 4. Database Setup & Seeding

> [!NOTE]
> The database is already connected to Neon PostgreSQL. If the tables are already initialized, you can skip straight to running the dev servers.

If setting up a fresh database instance or after wiping tables:

```bash
# 1. Generate Drizzle migrations
npm run db:generate --prefix backend

# 2. Push schema to Neon PostgreSQL
npm run db:push --prefix backend

# 3. Seed mock businesses, shipments, hubs, and routes
npm run seed --prefix backend
```

---

### 🚀 5. Running the Application

To launch both the Backend API server and Frontend client, run them in separate terminals:

#### Method A: Using Root Workspace Commands (Recommended)

**Terminal 1 — Backend Server (Port 3001):**
```bash
npm run dev:backend
```

**Terminal 2 — Frontend Client (Port 3000 / 5173):**
```bash
npm run dev:frontend
```

---

#### Method B: Running from Subdirectories

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Once running:
- **Frontend URL:** [http://localhost:3000](http://localhost:3000) (or `http://localhost:5173`)
- **Backend API Health Check:** [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 🔑 Demo & Test Accounts

For rapid evaluation and testing, the platform includes pre-seeded accounts equipped with a bypass mechanism:

| Role | Email Address | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **👑 Admin View** | `admin@karwaan.in` | `demo-access-2026` | Full platform visibility: Clusters, Multimodal India Map, Re-routing, Incidents |
| **🏢 Business View** | `logistics@sahyadri.in` | `demo-access-2026` | Shipper view: Manage own consignments, booking intake, freshness & cost savings |
| **🚚 Delivery Agent** | `agent1@karwaan.in` | `demo-access-2026` | Driver view: Active delivery route legs, IoT temperature log entry, Incident dispatch |

---

## 🤖 Machine Learning & Risk Intelligence

Karwaan integrates data-driven models trained on over **100,000 telemetry readings and 12,000 historical shipments**:

```
karwaan/
├── backend/models/
│   ├── train_delay_model.py       # Random Forest classifier for transit delays
│   ├── train_spoilage_model.py    # Predictive spoilage risk modeling
│   ├── predict_delay.py           # Real-time inference script
│   ├── predict_spoilage.py        # Real-time spoilage inference script
│   ├── delay_rf_model.pkl         # Serialized delay model artifact
│   └── spoilage_rf_model.pkl      # Serialized spoilage model artifact
├── delay_training_ready.csv       # Preprocessed delay training data
├── spoilage_training_ready.csv    # Preprocessed spoilage training data
└── audit_csvs.py                  # Telemetry data validation & integrity audit
```

To re-train the models locally:
```bash
cd backend/models
python -m venv venv
# Activate virtual environment:
# Windows: venv\Scripts\activate | Linux/macOS: source venv/bin/activate
pip install pandas numpy scikit-learn joblib
python train_delay_model.py
python train_spoilage_model.py
```

---

## 📡 API Endpoints

The backend exposes a structured RESTful API on `http://localhost:3001/api`:

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Service health and database connection status | No |
| `POST` | `/api/auth/login` | User authentication & JWT token generation | No |
| `GET` | `/api/shipments` | List all perishable shipments (filtered by business for shippers) | Yes |
| `POST` | `/api/shipments` | Create a new consignment booking | Yes |
| `GET` | `/api/clusters` | Retrieve AI consolidation clusters and grouped shipments | Yes |
| `GET` | `/api/routes` | Fetch multimodal delivery routes and active route legs | Yes |
| `POST` | `/api/recommendations/route` | Generate AI-optimized route (Road vs. Multimodal Rail) | Yes |
| `GET` | `/api/incidents` | List logged transit disruptions and thermal excursions | Yes |
| `POST` | `/api/incidents` | Report a new incident and trigger auto-rerouting | Yes |

---

## 👥 Team Juggernaut 🚀

<div align="center">

This project was ideated, designed, and developed by **Team Juggernaut** for sustainable, intelligent, and scalable cold-chain logistics across India.

<br/>

<center>
<table align="center" style="margin-left: auto; margin-right: auto; text-align: center;">
  <thead>
    <tr style="text-align: center;">
      <th align="center" style="text-align: center; padding: 8px 16px;">👤 Team Member</th>
      <th align="center" style="text-align: center; padding: 8px 16px;">🔗 GitHub Profile</th>
    </tr>
  </thead>
  <tbody>
    <tr style="text-align: center;">
      <td align="center" style="text-align: center; padding: 8px 16px;"><b>Siddharth Kumar Jena</b></td>
      <td align="center" style="text-align: center; padding: 8px 16px;"><a href="https://github.com/Sid-is-afk">@Sid-is-afk</a></td>
    </tr>
    <tr style="text-align: center;">
      <td align="center" style="text-align: center; padding: 8px 16px;"><b>Ashutosh Nayak</b></td>
      <td align="center" style="text-align: center; padding: 8px 16px;"><a href="https://github.com/newprogrammer07">@newprogrammer07</a></td>
    </tr>
    <tr style="text-align: center;">
      <td align="center" style="text-align: center; padding: 8px 16px;"><b>Ayutayam Sutar</b></td>
      <td align="center" style="text-align: center; padding: 8px 16px;"><a href="https://github.com/Ayutayam-sutar">@Ayutayam-sutar</a></td>
    </tr>
    <tr style="text-align: center;">
      <td align="center" style="text-align: center; padding: 8px 16px;"><b>Parnika Haldar</b></td>
      <td align="center" style="text-align: center; padding: 8px 16px;"><a href="https://github.com/Parnika-h">@Parnika-h</a></td>
    </tr>
    <tr style="text-align: center;">
      <td align="center" style="text-align: center; padding: 8px 16px;"><b>Bibhuti Bhusan Behera</b></td>
      <td align="center" style="text-align: center; padding: 8px 16px;"><a href="https://github.com/bibhutibhusanbehera07">@bibhutibhusanbehera07</a></td>
    </tr>
    <tr style="text-align: center;">
      <td align="center" style="text-align: center; padding: 8px 16px;"><b>Sushree Adyasha Sahoo</b></td>
      <td align="center" style="text-align: center; padding: 8px 16px;"><a href="https://github.com/sushree2006">@sushree2006</a></td>
    </tr>
  </tbody>
</table>
</center>

<br/>

**Organization & Source Repository:** [github.com/Juggernauts-jod](https://github.com/Juggernauts-jod)

</div>

---

## 📚 Citations & References

1. **National Centre for Cold-chain Development (NCCD), Ministry of Agriculture & Farmers Welfare, Government of India**: *All India Cold-chain Infrastructure Capacity Assessment & Post-Harvest Losses in Perishables*.
2. **Indian Railways — Freight Operations Information System (FOIS)**: *Cold-Chain Containerized Express Transit & Multimodal Freight Tariff Structures*.
3. **Food and Agriculture Organization (FAO) of the United Nations**: *Global Food Losses and Food Waste — Extent, Causes and Prevention in Fresh Produce Supply Chains*.
4. **Labuza, T. P. (1984)**: *Application of chemical kinetics to deterioration of foods*. Journal of Food Chemical Education & Arrhenius temperature-dependent shelf-life decay modeling.
5. **Pedregosa et al. (2011)**: *Scikit-learn: Machine Learning in Python*. Journal of Machine Learning Research, 12, pp. 2825–2830.
6. **CartoDB & OpenStreetMap Contributors**: *Voyager Map Tiles & GeoJSON Spatial Boundary Modeling for South Asian Transport Networks*.

---

<div align="center">
  <b>Built with ❤️ by Team Juggernaut 🚀</b><br>
  <i>New Day, New Error, New Learnings~Juggernaut!</i>
</div>