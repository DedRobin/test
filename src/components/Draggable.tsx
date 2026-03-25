import { useDraggable } from '@dnd-kit/react';

export default function Draggable() {
  const { ref } = useDraggable({
    id: 'draggableID',
  });

  return <button ref={ref}>Draggable</button>;
}
