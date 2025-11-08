"""
Migration: Add Advanced PDF Annotation Fields
Date: 2025-11-08
Description: Adds support for sticky notes, underline, strikethrough, and drawing annotations

New fields:
- annotation_type: Type of annotation (highlight, sticky_note, underline, strikethrough, drawing)
- sticky_note_position: Position and size for sticky notes {x, y, width, height}
- sticky_note_color: Color for sticky notes (hex code)
- text_formatting: Text formatting options {bold, underline, italic, strikethrough}
- drawing_data: SVG path data for freehand drawings
"""

from sqlalchemy import text
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import get_db

def apply_migration():
    """Apply the migration to add advanced PDF annotation fields"""
    db = next(get_db())
    
    try:
        from sqlalchemy import inspect
        
        # Check if columns already exist
        inspector = inspect(db.bind)
        existing_columns = [col['name'] for col in inspector.get_columns('annotations')]
        
        new_columns = ['annotation_type', 'sticky_note_position', 'sticky_note_color', 'text_formatting', 'drawing_data']
        existing_new_columns = [col for col in new_columns if col in existing_columns]
        
        if len(existing_new_columns) == 5:
            print("✅ All advanced PDF annotation columns already exist")
            return {
                "status": "already_applied",
                "message": "All advanced PDF annotation columns already exist in annotations table"
            }
        
        changes = []
        
        # Add annotation_type column
        if 'annotation_type' not in existing_columns:
            db.execute(text("""
                ALTER TABLE annotations
                ADD COLUMN annotation_type VARCHAR DEFAULT 'highlight';
            """))
            changes.append("Added annotation_type column")
            print("✅ Added annotation_type column")
        
        # Add sticky_note_position column
        if 'sticky_note_position' not in existing_columns:
            db.execute(text("""
                ALTER TABLE annotations
                ADD COLUMN sticky_note_position JSON;
            """))
            changes.append("Added sticky_note_position column")
            print("✅ Added sticky_note_position column")
        
        # Add sticky_note_color column
        if 'sticky_note_color' not in existing_columns:
            db.execute(text("""
                ALTER TABLE annotations
                ADD COLUMN sticky_note_color VARCHAR(7) DEFAULT '#FFEB3B';
            """))
            changes.append("Added sticky_note_color column")
            print("✅ Added sticky_note_color column")
        
        # Add text_formatting column
        if 'text_formatting' not in existing_columns:
            db.execute(text("""
                ALTER TABLE annotations
                ADD COLUMN text_formatting JSON;
            """))
            changes.append("Added text_formatting column")
            print("✅ Added text_formatting column")
        
        # Add drawing_data column
        if 'drawing_data' not in existing_columns:
            db.execute(text("""
                ALTER TABLE annotations
                ADD COLUMN drawing_data JSON;
            """))
            changes.append("Added drawing_data column")
            print("✅ Added drawing_data column")
        
        db.commit()
        
        print(f"\n✅ Migration completed successfully!")
        print(f"Changes applied: {len(changes)}")
        for change in changes:
            print(f"  - {change}")
        
        return {
            "status": "success",
            "changes": changes,
            "message": f"Successfully added {len(changes)} new columns to annotations table"
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Migration failed: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting migration: Add Advanced PDF Annotation Fields")
    print("=" * 60)
    result = apply_migration()
    print("=" * 60)
    print(f"Status: {result['status']}")
    print(f"Message: {result['message']}")

