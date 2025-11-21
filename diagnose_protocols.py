"""
Diagnostic script to check protocol data in database.
Run this to see what's actually stored for the protocols.
"""

import sys
sys.path.insert(0, '.')

from database import get_db, Protocol, User
from sqlalchemy.orm import Session

def diagnose_protocols():
    """Check protocol data in database."""
    db = next(get_db())
    
    try:
        # Find user by email
        user = db.query(User).filter(User.email == "fredericle75019@gmail.com").first()
        if not user:
            print("❌ User not found!")
            return
        
        print(f"✅ Found user: {user.email} (ID: {user.user_id})")
        print()
        
        # Get all protocols created by this user
        protocols = db.query(Protocol).filter(Protocol.created_by == user.user_id).all()
        
        print(f"📊 Found {len(protocols)} protocols")
        print("=" * 80)
        print()
        
        for i, protocol in enumerate(protocols, 1):
            print(f"PROTOCOL {i}: {protocol.protocol_name}")
            print("-" * 80)
            print(f"  Protocol ID: {protocol.protocol_id}")
            print(f"  Project ID: {protocol.project_id}")
            print(f"  Source PMID: {protocol.source_pmid}")
            print(f"  Type: {protocol.protocol_type}")
            print(f"  Difficulty: {protocol.difficulty_level}")
            print(f"  Duration: {protocol.duration_estimate}")
            print()
            
            print(f"  📦 Materials: {len(protocol.materials) if protocol.materials else 0}")
            if protocol.materials:
                for j, mat in enumerate(protocol.materials[:3], 1):  # Show first 3
                    print(f"     {j}. {mat.get('name', 'N/A')}")
                if len(protocol.materials) > 3:
                    print(f"     ... and {len(protocol.materials) - 3} more")
            else:
                print(f"     ⚠️  EMPTY!")
            print()
            
            print(f"  📋 Steps: {len(protocol.steps) if protocol.steps else 0}")
            if protocol.steps:
                for j, step in enumerate(protocol.steps[:3], 1):  # Show first 3
                    print(f"     {j}. {step.get('instruction', 'N/A')[:60]}...")
                if len(protocol.steps) > 3:
                    print(f"     ... and {len(protocol.steps) - 3} more")
            else:
                print(f"     ⚠️  EMPTY!")
            print()
            
            print(f"  🔧 Equipment: {len(protocol.equipment) if protocol.equipment else 0}")
            if protocol.equipment:
                for j, eq in enumerate(protocol.equipment[:3], 1):
                    print(f"     {j}. {eq}")
            else:
                print(f"     ⚠️  EMPTY!")
            print()
            
            # Context-aware fields
            print(f"  🧠 Context-Aware: {protocol.context_aware}")
            print(f"  📊 Relevance Score: {protocol.relevance_score}/100")
            print(f"  🎯 Extraction Method: {protocol.extraction_method}")
            print(f"  📈 Extraction Confidence: {protocol.extraction_confidence}/100" if protocol.extraction_confidence else "  📈 Extraction Confidence: None")
            print()
            
            if protocol.confidence_explanation:
                print(f"  📝 Confidence Explanation:")
                print(f"     Level: {protocol.confidence_explanation.get('confidence_level', 'N/A')}")
                print(f"     Score: {protocol.confidence_explanation.get('overall_score', 'N/A')}/100")
                if 'explanation' in protocol.confidence_explanation:
                    print(f"     Reason: {protocol.confidence_explanation['explanation'][:100]}...")
            print()
            
            print(f"  📅 Created: {protocol.created_at}")
            print(f"  📅 Updated: {protocol.updated_at}")
            print()
            print("=" * 80)
            print()
        
        # Summary
        print("\n📊 SUMMARY:")
        print("-" * 80)
        empty_protocols = [p for p in protocols if not p.materials or len(p.materials) == 0]
        print(f"Total protocols: {len(protocols)}")
        print(f"Empty protocols (no materials): {len(empty_protocols)}")
        print(f"Valid protocols (with materials): {len(protocols) - len(empty_protocols)}")
        print()
        
        if empty_protocols:
            print("⚠️  ISSUE DETECTED:")
            print("   Some protocols have metadata but no actual content!")
            print("   This suggests the AI extraction is failing but still saving the protocol.")
            print()
            print("   Possible causes:")
            print("   1. Paper doesn't contain a detailed experimental protocol")
            print("   2. AI extraction timeout or error")
            print("   3. Fallback data being saved without content")
            print()
            print("   Empty protocols:")
            for p in empty_protocols:
                print(f"   - {p.protocol_name} (PMID: {p.source_pmid})")
        
    finally:
        db.close()

if __name__ == "__main__":
    diagnose_protocols()

