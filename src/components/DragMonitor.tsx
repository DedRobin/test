import { useDragDropMonitor } from '@dnd-kit/react';

export default function DragMonitor() {
  useDragDropMonitor({
    // onBeforeDragStart(event, manager) {
    //   // Optionally prevent dragging
    //   if (shouldPreventDrag(event.operation.source)) {
    //     event.preventDefault();
    //   }
    // },
    onDragStart(event, manager) {
      console.log('Started dragging', event.operation.source);
    },
    onDragMove(event, manager) {
      console.log('Current position:', event.operation.position.current);
    },
    onDragOver(event, manager) {
      console.log('Over droppable:', event.operation.target);
    },
    onDragEnd(event, manager) {
      const { operation, canceled } = event;

      if (canceled) {
        console.log('Drag cancelled');
        return;
      }

      if (operation.target) {
        console.log(
          `Dropped ${operation.source.id} onto ${operation.target.id}`,
        );
      }
    },
    onCollision(event, manager) {
      console.log('Collisions:', event.collisions);
    },
  });

  return null;
}
