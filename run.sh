#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "================================================================="
echo "🏛️  Starting Antigravity Institutional Trading Workstation"
echo "================================================================="

# Function to kill child processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start Python FastAPI ML backend
echo "▶ Starting FastAPI ML Engine on http://localhost:8000..."
cd "$DIR/ml"
"$DIR/venv/bin/uvicorn" app:app --port 8000 --host 0.0.0.0 &
BACKEND_PID=$!

# Wait briefly for backend to initialize
sleep 2

# 2. Start Frontend Vite server
echo "▶ Starting Workstation UI on http://localhost:3000..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ All services are active and running!"
echo "   - Workstation UI:  http://localhost:3000"
echo "   - ML REST API:     http://localhost:8000/docs"
echo "   - Tick WebSocket:  ws://localhost:8000/ws/market"
echo ""
echo "Press Ctrl+C to terminate all services."

wait
