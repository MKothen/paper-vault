# Migration to @dnd-kit

## What Changed

PaperVault has been migrated from `@hello-pangea/dnd` to `@dnd-kit` to support React 19.

### Why?

`@hello-pangea/dnd` (the fork of `react-beautiful-dnd`) does not fully support React 19, causing component resolution errors. `@dnd-kit` is:
- ✅ Actively maintained
- ✅ React 19 compatible
- ✅ More flexible and performant
- ✅ Better TypeScript support

## Installation Instructions

### 1. Remove old packages

```bash
npm uninstall @hello-pangea/dnd
```

### 2. Install new packages

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 3. Clear cache and reinstall

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Changes Made

### Package.json
- **Removed:** `@hello-pangea/dnd`
- **Added:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

### VirtualKanbanBoard.tsx
Completely rewritten to use `@dnd-kit`:

**Old API:**
```tsx
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
```

**New API:**
```tsx
import { DndContext, DragOverlay, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
```

**Key Differences:**

1. **Context wrapper:** `DragDropContext` → `DndContext`
2. **Sensors:** Explicit sensor configuration for pointer and keyboard
3. **Sortable items:** `useSortable` hook instead of `Draggable` render props
4. **Drag overlay:** New `DragOverlay` component for drag preview
5. **Event handlers:** `onDragStart`, `onDragEnd`, `onDragCancel` instead of single `onDragEnd`

### App.tsx
- Removed unused `@hello-pangea/dnd` imports
- No functional changes to the App component

## Features Preserved

✅ Drag and drop between Kanban columns
✅ Virtual scrolling with `react-window`
✅ Visual drag preview
✅ Status change on drop
✅ All existing paper card features

## Testing

After installation, test:

1. ✅ Drag papers between "To Read", "Reading", and "Read" columns
2. ✅ Virtual scrolling with 100+ papers
3. ✅ Drag preview appears when dragging
4. ✅ Papers update status correctly
5. ✅ No console errors

## Troubleshooting

### "Module not found" errors
```bash
# Clear all caches
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### TypeScript errors
```bash
# Rebuild TypeScript
npm run build
```

### Vite HMR issues
```bash
# Restart dev server
npm run dev
```

## Performance Notes

`@dnd-kit` is generally more performant than `@hello-pangea/dnd`:
- Smaller bundle size (~25KB vs ~40KB gzipped)
- Better virtual list integration
- More efficient collision detection

## Resources

- [dnd-kit Documentation](https://docs.dndkit.com/)
- [dnd-kit Examples](https://master--5fc05e08a4a65d0021ae0bf2.chromatic.com/)
- [Migration Guide](https://docs.dndkit.com/introduction/getting-started)
