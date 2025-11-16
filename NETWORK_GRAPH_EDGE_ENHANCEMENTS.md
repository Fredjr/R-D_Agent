# Network Graph Edge Enhancements

## Summary
Enhanced the network graph visualization with better edge styling, color differentiation, animations, and cross-reference detection between non-central nodes.

## Changes Made

### 1. Enhanced Edge Styling in CytoscapeGraph Component
**File:** `frontend/src/components/CytoscapeGraph.tsx`

#### Color-Coded Edges by Relationship Type
- **Citation (Green #10b981)**: Papers that cite the target
- **Reference (Blue #3b82f6)**: Papers cited by the source
- **Similar (Purple #8b5cf6)**: Similar papers (dotted line style)
- **Co-authored (Orange #f59e0b)**: Same authors
- **Same Journal (Pink #ec4899)**: Published in same journal
- **Topic-related (Indigo #6366f1)**: Related by research topic

#### Visual Enhancements
- **Edge Labels**: Added labels with background for better readability
  - White background with 80% opacity
  - Rounded rectangle shape
  - 3px padding
- **Hover Effects**: 
  - Edges increase width from 2px to 4px on hover
  - Opacity increases to 100%
  - Color darkens slightly
  - Connected nodes are highlighted (other nodes fade to 30% opacity)
- **Animations**: 
  - Smooth transitions (0.2s) for width, opacity, and color changes
  - Dashed lines for animated edges (citation/reference)
  - Dotted lines for similarity edges

#### Interactive Features
- **Edge Hover Tooltips**: Shows relationship type and description
- **Node Highlighting**: When hovering over an edge, connected nodes are highlighted
- **Smooth Transitions**: All style changes animate smoothly

### 2. Cross-Reference Detection Between Non-Central Nodes
**File:** `frontend/src/app/api/proxy/pubmed/network/route.ts`

#### New Feature: Detect Relationships Between Non-Central Nodes
Previously, edges were only created from the central node to other nodes. Now the system:

1. **Checks Citations**: For each non-central node, checks if it cites other nodes in the network
2. **Checks References**: Checks if other nodes in the network cite it
3. **Creates Cross-Edges**: Adds edges between non-central nodes when relationships are found
4. **Avoids Duplicates**: Checks for existing edges before creating new ones
5. **Lower Weight**: Cross-reference edges have weight 0.5 (vs 1.0 for direct relationships)

#### Implementation Details
```typescript
// For each non-central node (limited to first 10 to avoid too many API calls)
for (let i = 0; i < nodePmids.length && i < 10; i++) {
  const nodePmid = nodePmids[i];
  
  // Check if this node cites any other nodes in our network
  const citedByThisNode = await findRelatedArticles(nodePmid, 'pubmed_pubmed_refs', 50);
  
  // Check if this node is cited by any other nodes in our network
  const citingThisNode = await findRelatedArticles(nodePmid, 'pubmed_pubmed_citedin', 50);
  
  // Create edges for found relationships
}
```

#### Performance Considerations
- Limited to first 10 nodes to avoid excessive API calls
- Each node makes 2 API calls (citations + references)
- Total: ~20 additional API calls per network load
- Errors are caught and logged without breaking the network generation

### 3. Enhanced Legend
**File:** `frontend/src/components/NetworkView.tsx`

#### Visual Improvements
- **Thicker Lines**: Increased from 0.5px to 1px height
- **Rounded Ends**: Changed to rounded-full for smoother appearance
- **Hover Effects**: Each legend item highlights on hover with colored background
- **Emojis**: Added color-coded emojis for quick visual reference
- **Shadow**: Added subtle shadow to edge lines
- **Helper Text**: Added "Hover over edges to highlight connections" hint

#### Legend Items
1. 🟢 Cites (Green)
2. 🔵 References (Blue)
3. 🟣 Similar (Purple, dotted)
4. 🟠 Co-authored (Orange)
5. 🩷 Same journal (Pink)
6. 🔷 Related topic (Indigo)

## User Experience Improvements

### Before
- All edges looked similar (blue)
- No visual distinction between relationship types
- No hover feedback
- Only edges from central node to other nodes
- Static, non-interactive edges

### After
- ✅ Color-coded edges by relationship type
- ✅ Edge labels with readable backgrounds
- ✅ Hover effects with node highlighting
- ✅ Smooth animations and transitions
- ✅ Cross-references between non-central nodes
- ✅ Enhanced legend with visual examples
- ✅ Interactive tooltips on edge hover

## Testing Recommendations

1. **Visual Testing**:
   - Navigate to a paper's network view
   - Verify edges have different colors based on relationship type
   - Hover over edges to see highlighting effects
   - Check that edge labels are readable

2. **Cross-Reference Testing**:
   - Load a network with multiple papers
   - Check browser console for "Found cross-reference" messages
   - Verify edges exist between non-central nodes
   - Confirm the network is more interconnected

3. **Performance Testing**:
   - Monitor API call count in network tab
   - Verify network loads within reasonable time (~5-10 seconds)
   - Check that errors in cross-reference detection don't break the network

## Technical Notes

### Edge Styling Hierarchy
1. Base edge style (gray, 2px)
2. Relationship-specific style (colored, 2-2.5px)
3. Hover style (darker color, 4px)
4. Animated style (dashed/dotted)

### Cytoscape Selectors Used
- `edge`: Base edge style
- `edge:hover`: Hover effects
- `edge[animated]`: Animated edges
- `edge[relationship="citation"]`: Citation-specific style
- `edge[relationship="reference"]`: Reference-specific style
- `edge[relationship="similarity"]`: Similarity-specific style
- `edge[relationship="co-authored"]`: Co-author-specific style
- `edge[relationship="same-journal"]`: Same journal-specific style
- `edge[relationship="topic-related"]`: Topic-related-specific style

### API Rate Limiting Considerations
The cross-reference detection makes additional PubMed API calls. To avoid rate limiting:
- Limited to first 10 nodes
- Each node makes 2 calls (citations + references)
- Errors are caught and logged
- Network generation continues even if some cross-references fail

## Future Enhancements

1. **Configurable Cross-Reference Depth**: Allow users to control how many nodes to check
2. **Edge Filtering**: Add UI controls to show/hide specific relationship types
3. **Edge Bundling**: Group multiple edges between same nodes
4. **Weighted Edges**: Vary edge thickness based on citation count or relationship strength
5. **Bidirectional Edges**: Show bidirectional relationships with special styling
6. **Edge Tooltips**: Add rich tooltips with paper titles and metadata
7. **Animation on Load**: Animate edges appearing one by one
8. **Edge Search**: Allow users to search for specific relationships

## Related Files
- `frontend/src/components/CytoscapeGraph.tsx` - Main graph component
- `frontend/src/components/NetworkView.tsx` - Network view with legend
- `frontend/src/app/api/proxy/pubmed/network/route.ts` - Network data API

