#!/bin/bash
echo "🛡️  Starting Aegis AI..."

# Seed memory if first run
if [ ! -d "backend/chroma_db" ]; then
  echo "📚 Seeding incident memory..."
  cd backend && python ../data/seed_incidents.py && cd ..
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Run these in separate terminals:"
echo "  Backend:  cd backend && uvicorn main:app --reload"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:5173"
