# 3f50d327d2834007a371d2819adeccb0

# App Demo

https://jenni-interview-assessment-demo.vercel.app/

# AI Text Paraphrasing App

A modern web application that allows users to paraphrase text using AI. The application consists of a React TypeScript frontend and a Rust backend that leverages OpenAI's API for text paraphrasing.

## Features

- Interactive text editor with selection-based paraphrasing
- Real-time AI-powered text paraphrasing
- Modern, responsive UI
- Robust error handling and logging

## Project Structure

- **Frontend**: React with TypeScript, built with Vite
- **Backend**: Rust with Actix-web, deployed with Shuttle
- **Testing**: Vitest for frontend, built-in Rust testing for backend

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or above)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable version)
- [Cargo](https://doc.rust-lang.org/cargo/) (comes with Rust)
- [Shuttle](https://www.shuttle.dev/docs/getting-started/installation) for backend deployment

## Getting Started

### Backend Setup

1. Navigate to the `backend` directory:

   ```
   cd backend
   ```

2. Install Shuttle CLI if you haven't already:

   ```
   cargo install cargo-shuttle
   ```

3. Create a `Secrets.toml` file based on `Secrets.toml.example` with your OpenAI API key:

   ```
   OPENAI_API_KEY='your_openai_api_key_here'
   ```

4. Run the backend server locally:

   ```
   cargo shuttle run
   ```

   The server will start on http://localhost:8000

### Frontend Setup

1. Navigate to the `frontend` directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example`:

   ```
   VITE_API_URL=http://localhost:8000
   ```

4. Start the development server:

   ```
   npm run dev
   ```

   The application will be available at http://localhost:5173

## Testing

### Backend Tests

Run the backend tests from the `backend` directory:

```
cargo test
```

### Frontend Tests

Run the frontend tests from the `frontend` directory:

```
npm test
```

## Deploying to Production

This app uses Shuttle for backend Rust deployment, and it is recommended to use Vercel for frontend deployment.

### Backend

1. If you haven't already, sign up for a Shuttle account at [shuttle.dev](https://www.shuttle.dev/)

2. Login to Shuttle from the CLI:

   ```
   cargo shuttle login
   ```

3. From the `backend` directory, deploy your application:

   ```
   cargo shuttle deploy
   ```

4. After deployment, Shuttle will provide you with a URL for your backend API. Use this URL in your frontend `VITE_API_URL` environment variable.

For more detailed information about Shuttle deployment, refer to the [official Shuttle documentation](https://www.shuttle.dev/docs).

### Frontend

1. If you haven't already, sign up for a Vercel account at [vercel.com](https://vercel.com)

2. Connect your GitHub, GitLab, or Bitbucket repository to Vercel

3. During the import process:

   - Set the "Framework Preset" to Vite
   - Set the "Root Directory" to your frontend directory
   - Add the environment variable `VITE_API_URL` with the value of your deployed Shuttle backend URL

4. Click "Deploy" and Vercel will build and deploy your frontend application

For more detailed information about Vercel deployment, visit the [Vercel documentation](https://vercel.com/docs).

## Environment Variables

### Backend

- `OPENAI_API_KEY`: Your OpenAI API key
- `RUST_LOG`: Log level (debug, info, error)

### Frontend

- `VITE_API_URL`: URL of the backend API

## Architecture Justification

For this project, I focused on creating an initial MVP that prioritizes clean code, good logging, and a solid foundation for future extensions. I structured the application with a clear separation between frontend and backend to keep concerns distinct and maintainable.

I particularly enjoy working with Vite for my React and Typescript projects because it's fast and minimal. The hot module reloading and optimized builds are also a productivity plus in during development. For deployment, Shuttle made the Rust backend deployment trivial, allowing me to focus more on the actual implementation within the time constraints.

In terms of tradeoffs, I chose to keep the UI minimal but functional to deliver the core requirements efficiently. While this approach sacrifices some visual polish, it allowed me to focus on the essential functionality. We can add more features and visual polish now that we have a solid foundation that has tests and clear deployment protocols.Similarly, I opted for a stateless application without persistence to simplify the initial implementation, though this would be a natural extension point for a production version.

If this were a real product with more development time, I'd consider adding authentification, expanding the AI capabilities beyond just paraphrasing (which honestly can be as simple as updating our rust paraphrasing API call to take a prompt as an argument which determines what sort of editing we want the AI to do). I'd also look into performance optimizations like caching and potentially adding analytics to understand user behavior better.

The current implementation is straightforward and provides a solid starting point that can grow without requiring a complete redesign, which was important to me when making architectural decisions.