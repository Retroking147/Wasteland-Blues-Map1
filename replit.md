# Fallout-Style Interactive Map Application

## Overview

This is a full-stack interactive map application built with a Fallout post-apocalyptic theme. The application allows users to view an interactive map with locations, roads, and vendors in both public and admin modes. The public interface displays published content for general users, while the admin interface provides full CRUD capabilities for managing map data. The application features a distinctive retro-futuristic UI design inspired by the Pip-Boy interface from the Fallout video game series.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client uses **React with TypeScript** and **Vite** as the build tool. The UI is built with **shadcn/ui components** based on **Radix UI primitives** and styled with **TailwindCSS**. The application implements a **post-apocalyptic theme** with custom CSS variables and retro terminal-style typography using Courier Prime and Orbitron fonts.

**State Management**: Uses **TanStack Query (React Query)** for server state management and caching, with custom hooks for local UI state like map zoom, filters, and selected locations.

**Routing**: Implements client-side routing with **wouter** - a lightweight React router. The app has two main routes: public map (`/`) and admin map (`/admin`).

**Component Structure**: Features modular components with map canvas, location markers, road overlays, and modal dialogs for location editing and information display.

### Backend Architecture
The server uses **Express.js** with TypeScript running on Node.js. The architecture follows a **RESTful API** design with clear separation between public and admin endpoints.

**Development Setup**: In development mode, the server integrates with Vite's middleware for hot module replacement and serves the React application. In production, it serves static assets from the built client.

**Storage Layer**: Implements an abstraction layer (`IStorage` interface) with an in-memory storage implementation (`MemStorage`). This design allows for easy migration to database storage later while maintaining the same API contract.

**API Design**: Separate endpoints for public data (`/api/map/public`) and admin data (`/api/map/admin`), with admin authentication via simple code verification.

### Data Storage Solutions
Currently uses **in-memory storage** with TypeScript classes and Maps for data persistence during application runtime. The database schema is defined using **Drizzle ORM** with PostgreSQL configuration, indicating preparation for database migration.

**Schema Design**: 
- **Locations**: Store map points with coordinates, types, descriptions, and publication status
- **Vendors**: Associated with locations, containing service information
- **Roads**: Connect locations with SVG path data for route visualization  
- **Map State**: Tracks admin codes and publication status

**Publication System**: Implements a dual-state system where content can be drafted in admin mode and published to public view, allowing content management workflow.

### Authentication and Authorization
Uses a **simple admin code system** for administrative access. Admin users must enter a valid code to access editing capabilities. The system verifies codes via API calls and maintains session state on the frontend.

**Security Model**: Separates public and admin data access at the API level, ensuring unpublished content remains hidden from public endpoints regardless of frontend state.

## External Dependencies

### Core Framework Dependencies
- **React 18** with TypeScript for frontend development
- **Express.js** for backend server framework
- **Vite** for development server and build tooling
- **Node.js** runtime environment

### Database and ORM
- **Drizzle ORM** for database schema definition and queries
- **PostgreSQL** database configuration (via `@neondatabase/serverless`)
- **connect-pg-simple** for PostgreSQL session storage

### UI and Styling
- **TailwindCSS** for utility-first styling with custom theme
- **shadcn/ui** component library built on Radix UI primitives
- **Radix UI** for accessible, unstyled UI primitives
- **Lucide React** for consistent iconography
- **class-variance-authority** for component variant management

### State Management and Data Fetching
- **TanStack Query** (React Query) for server state management
- **React Hook Form** with **Zod** validation for form handling
- **wouter** for lightweight client-side routing

### Development and Build Tools
- **TypeScript** for type safety across the full stack
- **ESBuild** for server-side bundling in production
- **PostCSS** with Autoprefixer for CSS processing
- **Replit-specific plugins** for development environment integration

### Utilities and Support
- **date-fns** for date manipulation
- **clsx** and **tailwind-merge** for conditional CSS classes
- **nanoid** for unique ID generation
- **zod** for runtime type validation and schema definition