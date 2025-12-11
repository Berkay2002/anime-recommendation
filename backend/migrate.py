#!/usr/bin/env python3
"""
Quick start script for MongoDB to PostgreSQL migration
Runs all migration steps in sequence
"""

import os
import sys
import subprocess

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n{'='*60}")
    print(f"🚀 {description}")
    print(f"{'='*60}\n")
    
    try:
        result = subprocess.run(command, shell=True, check=True, text=True)
        print(f"✅ {description} completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error during {description}: {e}")
        return False

def main():
    print("""
    ╔════════════════════════════════════════════════════════════╗
    ║  Anime Recommendation System - Migration to PostgreSQL     ║
    ║  MongoDB → Neon PostgreSQL with pgvector                   ║
    ╚════════════════════════════════════════════════════════════╝
    """)
    
    # Check environment variables
    if not os.getenv('DATABASE_URL'):
        print("❌ ERROR: DATABASE_URL environment variable not set!")
        print("   Please add it to your .env file")
        sys.exit(1)
    
    if not os.getenv('GOOGLE_API_KEY'):
        print("⚠️  WARNING: GOOGLE_API_KEY not set. You'll need it for embeddings.")
        response = input("   Continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # Change to scripts directory
    scripts_dir = os.path.join(os.path.dirname(__file__), 'scripts')
    os.chdir(scripts_dir)
    
    print(f"\n📂 Working directory: {os.getcwd()}")
    
    # Step 1: Migrate data
    if not run_command(
        "python migrate_to_postgres.py",
        "Step 1/2: Migrating anime data to PostgreSQL"
    ):
        print("\n❌ Migration failed. Please check the error above.")
        sys.exit(1)
    
    # Step 2: Generate embeddings
    print("\n⏳ This next step may take 20-30 minutes...")
    response = input("   Ready to generate embeddings? (y/n): ")
    
    if response.lower() == 'y':
        if not run_command(
            "python generate_embeddings.py",
            "Step 2/2: Generating embeddings with Google API"
        ):
            print("\n❌ Embedding generation failed. You can retry later by running:")
            print("   python backend/scripts/generate_embeddings.py")
            sys.exit(1)
    else:
        print("\n⏭️  Skipping embedding generation.")
        print("   Run it later with: python backend/scripts/generate_embeddings.py")
    
    print("""
    
    ╔════════════════════════════════════════════════════════════╗
    ║                   ✨ Migration Complete! ✨                ║
    ╚════════════════════════════════════════════════════════════╝
    
    Next steps:
    
    1. Install frontend dependencies:
       cd frontend
       npm install
    
    2. Start the development server:
       npm run dev
    
    3. Open http://localhost:3000
    
    4. Test the features:
       - Browse anime
       - Search functionality
       - Get recommendations
    
    See MIGRATION_GUIDE.md for more details.
    """)

if __name__ == "__main__":
    main()
